// --------------- Imports --------------- //

import type { GameState, CardInstance, Attribute, Zone, CardCriteria } from "./game"
import { getZoneOfCard, getCardById, mutateCard, getCardsByCriteria, checkCriteria, applyAtom } from "./game"
import { pipe, D, A, O } from "@mobily/ts-belt"

// --------------- Ability Types --------------- //

type AbilityBase = {
  name: string
  description: string
  limit: number | "Unlimited"
  selectionCriteria?: CardCriteria[]
  stateCheck?: (ctx: AbilityContext) => boolean
  effects: Effect[]
}
export type Ability = AbilityBase & {
  type: "Activated"
  fromZone: Zone | "Any"
} | AbilityBase & {
  type: "Triggered"
  from?: Zone
  to: Zone
}

export type Effect = {type: "Summon This"} //todo: attribute materials
  | {type: "Move This", to: Zone} 
  | {type: "Move Selected", to: Zone} 
  | {type: "Move All", criteria: CardCriteria[], to: Zone}
  | {type: "Draw"}
  | {type: "Draw by Criteria", criteria: CardCriteria[]}
  | {type: "Mill"}
  | {type: "Mill by Criteria", criteria: CardCriteria[]}
//todo: mutations and card spawning

export type EffectAtom = {
  type: "Move"
  id: number
  from: Zone
  to: Zone
}

export type AbilityContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type Selections = {
  card?: CardInstance
  attribute?: Attribute
}

// --------------- Reifying Effects to Effect Atoms --------------- //

const reifySingleEffect = (ctx: AbilityContext, eff: Effect, selections: Selections): EffectAtom[] => {
  const gs = ctx.gameState
  const card = ctx.thisCard
  const from = getZoneOfCard(gs, card.id)
  if (eff.type === "Summon This") {
    return [
      {type: "Move", id: card.id, from, to: "Field"}
    ]
  } else if (eff.type === "Move This") {
    return [
      {type: "Move", id: card.id, from, to: eff.to}
    ]
  } else if (eff.type === "Move Selected") {
    const target = selections.card!
    const targetFrom = getZoneOfCard(gs, target.id)
    return [
      {type: "Move", id: target.id, from: targetFrom, to: eff.to}
    ]
  } else if (eff.type === "Move All") {
    return [...pipe(
      getCardsByCriteria(gs, eff.criteria),
      A.map(t => ({type: "Move" as const, id: t.id, from: getZoneOfCard(gs, t.id), to: eff.to}))
    )]
  } else if (eff.type === "Draw") {
    return pipe(
      gs.Deck,
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "Hand"}],
        () => []
      )
    )
  } else if (eff.type === "Draw by Criteria") {
    return pipe(
      gs.Deck,
      A.filter(c => checkCriteria(gs, c, eff.criteria)),
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "Hand"}],
        () => []
      )
    )
  } else if (eff.type === "Mill") {
    return pipe(
      gs.Deck,
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "GY"}],
        () => []
      )
    )
  } else if (eff.type === "Mill by Criteria") {
    return pipe(
      gs.Deck,
      A.filter(c => checkCriteria(gs, c, eff.criteria)),
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "GY"}],
        () => []
      )
    )
  } else {
    throw eff satisfies never
  }
}

// --------------- Ability Application --------------- //

export const canUseAbility = (ctx: AbilityContext): boolean => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  const gs = ctx.gameState
  //must be an activated ability
  if (ability.type !== "Activated") return false
  //can't have hit its usage limits
  if (ability.limit !== "Unlimited" && card.abilityUsages[ability.name] >= ability.limit) return false
  //must be in fromZone
  if (ability.fromZone !== "Any" && ability.fromZone !== getZoneOfCard(gs, card.id)) return false
  //must pass its own stateCheck if it has one
  if (ability.stateCheck && !ability.stateCheck(ctx)) return false
  //if we get here, it's good to go
  return true
}

export const applyAbility = (ctx: AbilityContext, selections: Selections): GameState => {
  //apply primary ability effects
  const resultAfterAbility = threadEffects(ctx.gameState, ctx.thisAbility.effects, ctx, selections)
  //apply trigger cascades
  const resultAfterTriggers = resolveTriggerCascade(resultAfterAbility)
  //finish up
  return pipe(
    resultAfterTriggers.gs,
    //increment moves if activated
    gs => (ctx.thisAbility.type === "Activated") ? ({...gs, moves: gs.moves+1,}) : gs,
    //add logs
    gs => ({...gs, logs: [...gs.logs, ...resultAfterTriggers.atoms]}),
    //mutate card with ability usage
    gs => {
      //we have to re-get the card because the original "card" variable is stale after running effects
      const updatedCard = getCardById(gs, ctx.thisCard.id) 
      const newUsages = updatedCard.abilityUsages[ctx.thisAbility.name] + 1
      //todo: wanna do this without using mutateCard()
      return mutateCard(gs, updatedCard.id, {
        abilityUsages: {
          ...updatedCard.abilityUsages,
          [ctx.thisAbility.name]: newUsages
        }
      })
    }
  )
}

// --------------- Effect Threading --------------- //

type EffectResult = {
  gs: GameState,
  atoms: EffectAtom[]
}

const threadEffects = (gs: GameState, effects: Effect[], ctx: AbilityContext, selections: Selections): EffectResult => {
  //this generates all the effect atoms generated by an effect, and returns those alongside the updated gamestate
  return A.reduce(
    effects,
    {gs, atoms: []} as EffectResult,
    (result, eff) => {
      const effectCtx: AbilityContext = {...ctx, gameState: result.gs}
      const newAtoms = reifySingleEffect(effectCtx, eff, selections)
      const updatedGs = A.reduce(newAtoms, result.gs, applyAtom)
      return {gs: updatedGs, atoms: [...result.atoms, ...newAtoms]}
    }
  )
}

// --------------- Triggers --------------- //

const resolveTriggerCascade = (currentResult: EffectResult): EffectResult => {
  // this "recursively" generates and works through chaining triggers until there are no more 
  // returns the new game state and all the logs (including whatever logs were already passed to it)
  let gs = {...currentResult.gs}
  let atoms = [...currentResult.atoms]
  let triggerQueue = getTriggersFromAtoms({gs, atoms})
  //todo: failsafe for breaking infinite loops
  while (triggerQueue.length > 0) {
    const [triggerId, triggerAbility] = triggerQueue.pop()!
    const triggerCtx: AbilityContext = {gameState: gs, thisCard: getCardById(gs, triggerId), thisAbility: triggerAbility}
    const triggerResult = threadEffects(gs, triggerAbility.effects, triggerCtx, {}) //triggers currently have no selections
    gs = triggerResult.gs
    atoms = [...atoms, ...triggerResult.atoms]
    const newTriggers = getTriggersFromAtoms({gs, atoms: triggerResult.atoms})
    triggerQueue = [...triggerQueue, ...newTriggers]
  }
  return {gs, atoms}
}

const getTriggersFromAtoms = (result: EffectResult): [number, Ability][] => {
  return [...pipe(
    result.atoms,
    A.map(atom => getTriggersFromSingleAtom(result.gs, atom)),
    A.flat
  )]
}

const getTriggersFromSingleAtom = (gs: GameState, atom: EffectAtom): [number, Ability][] => {
  //right now, only the card that actually moves can activate the trigger
  //todo: handle when a trigger is activated by a *different* card's movement
  console.log(`COUNTING TRIGGERS...`)
  return [...pipe(
    getCardById(gs, atom.id).abilities,
    //not sure why all the category stuff has to be shoved into one A.filter()...
    A.filter(ability => ability.type === "Triggered"
                        && ability.to === atom.to
                        && (ability.from ? (ability.from === atom.from) : true)),
    //todo: activation limits, etc...
    //should probably be rolled into the ability checks above (or vice versa)
    A.map(trigger => [atom.id, trigger] as [number, Ability]),
    // A.tap(pair => {console.log(JSON.stringify(pair))})
    A.tap(pair => {console.log(`Got trigger from #${pair[0]} with ability named "${pair[1].name}"`)})
  )]
}