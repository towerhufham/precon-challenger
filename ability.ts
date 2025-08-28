import type { GameState, CardInstance, Attribute, Zone, CardCriteria } from "./game"
import { getZoneOfCard, getCardById, mutateCard, getCardsByCriteria, checkCriteria, applyAtom } from "./game"
import { pipe, D, A, O } from "@mobily/ts-belt"

// --------------- Abilities --------------- //

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

export type AbilityBase = {
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

export type AbilityContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type Selections = {
  card?: CardInstance
  attribute?: Attribute
}

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

export const reifySingleEffect = (ctx: AbilityContext, eff: Effect, selections: Selections): EffectAtom[] => {
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

export const applyEffects = (ctx: AbilityContext, effects: Effect[], selections: Selections): [GameState, EffectAtom[]] => {
  let newGs: GameState = {...ctx.gameState}
  let logs: EffectAtom[] = []
  for (const eff of effects) {
    //have to reconstruct ctx here, because it doesn't keep track of gameState updates!
    const newCtx: AbilityContext = {...ctx, gameState: newGs}
    const atoms = reifySingleEffect(newCtx, eff, selections)
    logs = [...logs, ...atoms]
    newGs = A.reduce(atoms, newGs, applyAtom)
  }
  return [newGs, logs]
}

export const applyAbility = (ctx: AbilityContext, selections: Selections): GameState => {
  //shorthands
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  //build new state
  let [newState, logs] = applyEffects(ctx, ability.effects, selections)
  //if any triggers happen, apply their effects
  let triggerQueue = [...getTriggersFromAtoms(ctx.gameState, logs)]
  while (triggerQueue.length > 0) {
    //apply triggered effects
    const trigger = triggerQueue.pop()!
    const [triggerId, triggerAbility] = trigger
    const triggerCtx: AbilityContext = {
      gameState: newState, 
      thisCard: getCardById(newState, triggerId), 
      thisAbility: triggerAbility
    }
    const [trigGs, trigLogs] = applyEffects(triggerCtx, triggerAbility.effects, {}) //right now, triggers can't have selections- that's fine
    newState = trigGs
    logs = [...logs, ...trigLogs]
    const nextTriggers = [...getTriggersFromAtoms(newState, trigLogs)]
    triggerQueue = [...triggerQueue, ...nextTriggers]
  }
  //finish up
  return pipe(
    newState,
    //increment moves if activated
    gs => (ability.type === "Activated") ? ({...gs, moves: gs.moves+1,}) : gs,
    //add logs
    gs => ({...gs, logs: [...gs.logs, ...logs]}),
    //mutate card with ability usage
    gs => {
      //we have to re-get the card because the original "card" variable is stale after running effects
      const updatedCard = getCardById(gs, card.id) 
      const newUsages = updatedCard.abilityUsages[ability.name] + 1
      return mutateCard(gs, updatedCard.id, {
        abilityUsages: {
          ...updatedCard.abilityUsages,
          [ability.name]: newUsages
        }
      })
    }
  )
}

export const getTriggersFromSingleAtom = (gs: GameState, atom: EffectAtom): [number, Ability][] => {
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

export const getTriggersFromAtoms = (gs: GameState, atoms: EffectAtom[]): [number, Ability][] => {
  return [...pipe(
    atoms,
    A.map(atom => getTriggersFromSingleAtom(gs, atom)),
    A.flat
  )]
}