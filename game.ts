// --------------- Imports --------------- //

import { pipe, D, A, O } from "@mobily/ts-belt"
import { inPlaceShuffle } from "./utils"

// --------------- Game Constants --------------- //

export const ALL_ATTRIBUTES = ["Qli-Left", "Qli-Right", "Magic", "Evil", "Eggs"] as const
export type Attribute = typeof ALL_ATTRIBUTES[number]

export const ALL_ITEMS = ["Yellow Key", "Blue Key", "Red Key"] as const
export type Item = typeof ALL_ATTRIBUTES[number]

export const ALL_ZONES = ["Deck", "Hand", "Field", "Extra", "GY", "Removed"] as const
export type Zone = typeof ALL_ZONES[number]

// --------------- Cards --------------- //

export type CardDefinition = {
  collectionNumber: number
  name: string
  attributes: Attribute[]
  abilities: Ability[]
  color: string
  // power: number
  // maxPower: number | "Unlimited"
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
  logs: Log[]
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

export type EffectUnit = {type: "Summon This"} //todo: attribute materials
  | {type: "Move This", to: Zone} 
  | {type: "Move Selected", to: Zone} 
  | {type: "Move All", criteria: CardCriteria[], to: Zone}
  | {type: "Draw"}
  | {type: "Draw by Criteria", criteria: CardCriteria[]}
//todo: mutations and card spawning

export type CardCriteria = {type: "In Zone", zone: Zone}
  | {type: "Has Attribute", attribute: Attribute}
  //| {type: "NOT", criteria: CardCriteria}
  //| {type: "NONE", criteria: CardCriteria[]}
  //| {type: "ANY", criteria: CardCriteria[]}
  //| {type: "ALL", criteria: CardCriteria[]}

export type Ability = {
  name: string
  description: string
  limit: number | "Unlimited"
  fromZone: Zone | "Any"
  selectionCriteria?: CardCriteria[]
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effects: EffectUnit[]
}

export type AbilityUsageContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type Selections = {
  card?: CardInstance
  attribute?: Attribute
}

export const canUseAbility = (ctx: AbilityUsageContext): boolean => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  const gs = ctx.gameState
  return A.all(
    [
      //first check usage limits
      () => ability.limit === "Unlimited" ||
            card.abilityUsages[ability.name] < ability.limit,
      //check if it's in the right zone
      () => ability.fromZone === "Any" ||
            ability.fromZone === getZoneOfCard(gs, card.id),
      //now do state check, if there is one
      () => !ability.stateCheck || ability.stateCheck(ctx),
      //todo: maybe preliminary selection checks, to ensure we can meet the minimum amount
    ], (check => check())
  )
}

export const reifyEffectUnit = (ctx: AbilityUsageContext, eff: EffectUnit, selections: Selections): Log[] => {
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
        card => [{type: "Move" as const, id: card.id, from: "Deck", to: "Hand"}],
        () => []
      )
    )
  } else if (eff.type === "Draw by Criteria") {
    //TODO: shuffle deck afterwards!
    return pipe(
      gs.Deck,
      A.filter(c => checkCriteria(gs, c, eff.criteria)),
      A.head,
      O.match(
        card => [{type: "Move" as const, id: card.id, from: "Deck", to: "Hand"}],
        () => []
      )
    )
  } else {
    throw eff satisfies never
  }
}

export const reifyEffectUnits = (ctx: AbilityUsageContext, effs: EffectUnit[], selection: Selections): Log[] => {
  return [...pipe(
    effs,
    A.map(eff => reifyEffectUnit(ctx, eff, selection)),
    A.flat
  )]
}

export const applyLog = (gs: GameState, log: Log): GameState => {
  //for now, it's only type: "Move"
  return moveCardToZone(gs, log.id, log.to)
}

export const applyLogs = (gs: GameState, logs: Log[]): GameState => {
  //todo, might be where trigger chaining logic is held
  return logs.reduce((tempGs, log) => applyLog(tempGs, log), gs)
}

export const applyAbility = (ctx: AbilityUsageContext, selections: Selections): GameState => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  //TODO: this way of recording logs will become incomplete when triggers exist!
  const logs = reifyEffectUnits(ctx, ability.effects, selections)
  return pipe(
    ctx.gameState,
    //apply effect units generated by the ability
    gs => applyLogs(gs, logs),
    //increment moves & add logs to gs (TODO: won't work with triggers!)
    gs => ({
      ...gs, 
      moves: gs.moves+1,
      logs: [...gs.logs, ...logs]
    }),
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
    }
  )
}

// --------------- Triggers --------------- //

export type Log = {
  type: "Move"
  id: number
  from: Zone
  to: Zone
}

export type Trigger = {
  name: string
  description: string
  limit: number | "Unlimited"
  //only zone triggers for now, no selections
  zone: Zone
  effects: EffectUnit[]
}