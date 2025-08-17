// --------------- Imports --------------- //

import { pipe, D, A, O } from "@mobily/ts-belt"
import { inPlaceShuffle } from "./utils"

// --------------- Game Constants --------------- //

export const ALL_ATTRIBUTES = ["Qli-Left", "Qli-Right", "Magic", "Evil", "Eggs", "Pyramidas", "Tears"] as const
export type Attribute = typeof ALL_ATTRIBUTES[number]

export const ALL_ITEMS = ["Yellow Key", "Blue Key", "Red Key"] as const
export type Item = typeof ALL_ITEMS[number]

export const ALL_ZONES = ["Deck", "Hand", "Field", "Extra", "GY", "Removed"] as const
export type Zone = typeof ALL_ZONES[number]

// --------------- Cards --------------- //

export type CardDefinition = {
  collectionNumber: number
  name: string
  attributes: Attribute[]
  abilities: Ability[]
  color: string
}

export type CardInstance = CardDefinition & {
  id: number,
  abilityUsages: {[abilityName: string]: number}
}

// --------------- Game State --------------- //

export type GameState = {
  moves: number
  nextId: number
  Deck: CardInstance[]
  Hand: CardInstance[]
  Field: CardInstance[]
  Extra: CardInstance[]
  GY: CardInstance[]
  Removed: CardInstance[]
  items: Item[]
  logs: EffectAtom[]
}

export const initGameState = (decklist: CardDefinition[]): GameState => {
  //instantiate cards into deck
  const Deck: CardInstance[] = decklist.map((cardDef, index) => instantiateCard(cardDef, index))
  //shuffle deck
  inPlaceShuffle(Deck)
  //starting state
  const gs: GameState = {
    moves: 0,
    nextId: decklist.length,
    Deck,
    Hand: [],
    Field: [],
    Extra: [],
    GY: [],
    Removed: [],
    items: [],
    logs: []
  }
  //draw 5
  return pipe(
    gs,
    drawCard,
    drawCard,
    drawCard,
    drawCard,
    drawCard
  )
}

export const instantiateCard = (definition: CardDefinition, id: number): CardInstance => {
  const abilityUsages: {[abilityName: string]: number} = pipe(
    definition.abilities.map(a => [a.name, 0] as const),
    D.fromPairs
  )
  return {
    ...definition, id, abilityUsages
  }
}

export const spawnCardTo = (gs: GameState, definition: CardDefinition, to: Zone): GameState => {
  return {
    ...gs,
    nextId: gs.nextId + 1,
    [to]: [...gs[to], instantiateCard(definition, gs.nextId)]
  }
}

export const drawCard = (gs: GameState): GameState => {
  return pipe(
    gs.Deck,
    A.head,
    O.match(
      card => moveCardToZone(gs, card.id, "Hand"),
      () => gs
    )
  )
}

export const drawCardByCriteria = (gs: GameState, criteria: CardCriteria[]): GameState => {
  return pipe(
    gs.Deck,
    A.filter(c => checkCriteria(gs, c, criteria)),
    A.head,
    O.match(
      card => moveCardToZone(gs, card.id, "Hand"),
      () => gs
    )
  )
}

export const getCardById = (gs: GameState, id: number): CardInstance => {
  return pipe(
    ALL_ZONES,
    A.map(zone => gs[zone]),
    A.flat,
    A.find(card => card.id === id),
    O.match(
      card => card,
      () => {throw new Error(`GAME ERROR: can't find card instance of id ${id}!`)}
    )
  )  
}

export const getAllCards = (gs: GameState): CardInstance[] => {
  return [...pipe(
    ALL_ZONES,
    A.map(z => gs[z]),
    A.flat
  )]
}

export const getZoneOfCard = (gs: GameState, id: number): Zone => {
  return pipe(
    ALL_ZONES,
    A.find(zone => gs[zone].some(card => card.id === id)),
    O.match(
      zone => zone,
      () => {throw new Error(`GAME ERROR: can't find zone of card with id ${id}!`)}
    )
  )
}

export const checkSingleCriteria = (gs: GameState, card: CardInstance, criteria: CardCriteria): boolean => {
  switch (criteria.type) {
    case "In Zone":
      return getZoneOfCard(gs, card.id) === criteria.zone
    case "Has Attribute":
      return card.attributes.includes(criteria.attribute)
    default:
      throw criteria satisfies never
  }
}

export const checkCriteria = (gs: GameState, card: CardInstance, criteria: CardCriteria[]): boolean => {
  return A.all(criteria, c => checkSingleCriteria(gs, card, c))
}

export const getCardsByCriteria = (gs: GameState, criteria: CardCriteria[]): CardInstance[] => {
  return [...A.filter(getAllCards(gs), c => checkCriteria(gs, c, criteria))]
}

export const moveCardToZone = (gs: GameState, id: number, zone: Zone): GameState => {
  const oldZone = getZoneOfCard(gs, id)
  return {
    ...gs,
    [oldZone]: gs[oldZone].filter(c => c.id !== id),
    [zone]: [...gs[zone], getCardById(gs, id)]
  }
}

export const mutateCard = (gs: GameState, id: number, mutations: Partial<CardInstance>): GameState => {
  //sanity check to make sure the id is not being mutated
  if ("id" in mutations) throw new Error(`GAME ERROR: trying to mutate card with id ${id} into having id ${mutations.id}!`)
  const zone = getZoneOfCard(gs, id)
  const updatedZone = A.map(
    gs[zone],
    card => card.id === id 
      ? { ...card, ...mutations }
      : card
  )
  return {
    ...gs,
    [zone]: updatedZone
  }
}

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

export type CardCriteria = {type: "In Zone", zone: Zone}
  | {type: "Has Attribute", attribute: Attribute}
  //| {type: "NOT", criteria: CardCriteria}
  //| {type: "NONE", criteria: CardCriteria[]}
  //| {type: "ANY", criteria: CardCriteria[]}
  //| {type: "ALL", criteria: CardCriteria[]}

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
    //TODO: draw/mill problem described below
    return pipe(
      gs.Deck,
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "Hand"}],
        () => []
      )
    )
  } else if (eff.type === "Draw by Criteria") {
    //TODO: draw/mill problem described below
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
    //TODO: draw/mill problem described below
    return pipe(
      gs.Deck,
      A.head,
      O.match(
        card => [{type: "Move", id: card.id, from: "Deck", to: "GY"}],
        () => []
      )
    )
  } else if (eff.type === "Mill by Criteria") {
    //TODO: draw/mill problem described below
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

export const reifyEffects = (ctx: AbilityContext, effs: Effect[], selection: Selections): EffectAtom[] => {
  console.log(`REIFYING [#${ctx.thisCard.id}]'s ability named "${ctx.thisAbility.name}"`)
  return [...pipe(
    effs,
    A.map(eff => reifySingleEffect(ctx, eff, selection)),
    A.flat,
    A.tap(atom => console.log(JSON.stringify(atom)))
  )]
}

export const applySingleAtom = (gs: GameState, atom: EffectAtom): GameState => {
  //for now, it's only type: "Move"
  return moveCardToZone(gs, atom.id, atom.to)
}

export const applyAtoms = (gs: GameState, atoms: EffectAtom[]): GameState => {
  return atoms.reduce((tempGs, atom) => applySingleAtom(tempGs, atom), gs)
}

//TODO: DRAW/MILL PROBLEM!
//reifying the effects in a batch doesn't work right!
//for instance, the triple mill cards don't actually move cards until it builds the atoms
//which means it will make 3 atoms for the exact same id to move; because the draw/mill functions-
//don't actually update the topdeck card!

export const applyAbility = (ctx: AbilityContext, selections: Selections): GameState => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  const atoms = reifyEffects(ctx, ability.effects, selections)
  //check triggers
  const triggers = getTriggersFromAtoms(ctx.gameState, atoms)
  return pipe(
    ctx.gameState,
    //apply effect units generated by the ability
    gs => applyAtoms(gs, atoms),
    //increment moves if activated
    gs => (ability.type === "Activated") ? ({...gs, moves: gs.moves+1,}) : gs,
    //add logs
    gs => ({...gs, logs: [...gs.logs, ...atoms]}),
    //mutate card with ability usage
    gs => {
      //we have to re-get the card because the card may have been mutated by its effect
      //this is because this function threads the gamestate, but *not* the original ctx object!
      const updatedCard = getCardById(gs, card.id) 
      const newUsages = updatedCard.abilityUsages[ability.name] + 1
      return mutateCard(gs, updatedCard.id, {
        abilityUsages: {
          ...updatedCard.abilityUsages,
          [ability.name]: newUsages
        }
      })
    },
    //if any triggers activated, do them recursively
    gs => triggers.reduce(
      (tempGs, [cardId, trig]) => applyAbility({
        gameState: tempGs,
        thisCard: getCardById(tempGs, cardId),
        thisAbility: trig
      }, {}), 
    gs)
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