// --------------- Imports --------------- //

import { inPlaceShuffle } from "./utils"

// --------------- Game Constants --------------- //

export const ALL_ELEMENTS = ["Holy", "Fire", "Stone", "Thunder", "Plant", "Wind", "Water", "Dark"] as const
export type Elemental = typeof ALL_ELEMENTS[number]

export type EnergyPool = {[key in Elemental]: number}

export const ALL_ZONES = ["Deck", "Hand", "Field", "Extra", "GY", "Removed"] as const
export type Zone = typeof ALL_ZONES[number]

// --------------- Cards --------------- //

export type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Elemental[]
  abilities: Ability[]
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
  energyPool: EnergyPool
}

const makeEmptyEnergyPool = (): EnergyPool => {
  return {
    "Holy": 0,
    "Fire": 0,
    "Stone": 0,
    "Thunder": 0,
    "Plant": 0,
    "Wind": 0,
    "Water": 0,
    "Dark": 0
  }
}

export const initGameState = (decklist: CardDefinition[]): GameState => {
  //instantiate cards into deck
  let nextId = 0
  const Deck: CardInstance[] = []
  for (const cardDef of decklist) {
    Deck.push(instantiateCard(cardDef, nextId))
    nextId++
  }
  //shuffle deck
  inPlaceShuffle(Deck)
  //starting state
  const gs: GameState = {
    moves: 0,
    nextId,
    Deck,
    Hand: [],
    Field: [],
    Extra: [],
    GY: [],
    Removed: [],
    energyPool: makeEmptyEnergyPool(),
  }
  //silly way of drawing starting hand lol
  return drawCard(drawCard(drawCard(drawCard(drawCard(gs)))))
}

export const instantiateCard = (definition: CardDefinition, id: number): CardInstance => {
  let abilityUsages: {[abilityName: string]: number} = {}
  for (const ability of definition.abilities) {
    abilityUsages[ability.name] = 0
  }
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
  if (gs.Deck.length < 1) return gs
  const topDeck = gs.Deck[0]
  return moveCardToZone(gs, topDeck.id, "Hand")
}

export const getCardById = (gs: GameState, id: number): CardInstance => {
  for (const zone of ALL_ZONES) {
    for (const card of gs[zone]) {
      if (card.id === id) return card
    }
  }
  throw new Error(`GAME ERROR: can't find card instance of id ${id}!`)
}

export const getZoneOfCard = (gs: GameState, id: number): Zone => {
  for (const zone of ALL_ZONES) {
    for (const card of gs[zone]) {
      if (card.id === id) return zone
    }
  }
  throw new Error(`GAME ERROR: can't find zone of card with id ${id}!`)
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
  const previousCards = []
  const nextCards = []
  let foundOurCard = false
  for (const card of gs[zone]) {
    if (card.id !== id) {
      foundOurCard ? nextCards.push(card) : previousCards.push(card)
    } else {
      foundOurCard = true
    }
  }
  const mutatedCard = Object.assign(getCardById(gs, id), mutations)
  return {
    ...gs,
    [zone]: [...previousCards, mutatedCard, ...nextCards]
  }
}

// --------------- Abilities --------------- //

export type Ability = {
  name: string
  description: string
  energyCost: Partial<EnergyPool> //todo: any energy, doubling costs, etc
  limit: number | "Unlimited"
  fromZone: Zone | "Any"
  toZone?: Zone
  selections?: SelectionCriteria //[] | ((ctx: AbilityUsageContext) => SelectionCriteria[])
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effect?: (ctx: AbilityUsageContext, selections: Selections) => GameState
}

export type AbilityUsageContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type SelectionCriteria = {
  type: "Card"
  amount: number | {min: number, max: number} | "Unlimited"
  cardCriteria: (card: CardInstance) => boolean
} | {
  type: "Element"
  allowedElements: "All" | Elemental[]
}

export type Selections = {
  card?: CardInstance
  element?: Elemental
}

export const canSpendEnergy = (pool: EnergyPool, cost: Partial<EnergyPool>): boolean => {
  for (const el of Object.keys(cost) as Array<Elemental>) {
    //if it's less than what's required, it can't be paid
    if (pool[el] < cost[el]!) return false
  }
  //if we make it here, it's payable
  return true
}

export const spendEnergy = (pool: EnergyPool, cost: Partial<EnergyPool>): EnergyPool => {
  //if we don't have enough, error
  if (!canSpendEnergy(pool, cost)) throw new Error(`GAME ERROR: Trying to spend ${JSON.stringify(cost)} but pool only has ${JSON.stringify(pool)}!`)
  //kinda dumb
  let newPool = {...pool}
  for (const el of Object.keys(cost) as Array<Elemental>) {
    newPool[el] -= cost[el]!
  }
  return newPool
}

export const canUseAbility = (ctx: AbilityUsageContext): boolean => {
  //first check usage limits
  const ability = ctx.thisAbility
  if (ability.limit !== "Unlimited") {
    if (ctx.thisCard.abilityUsages[ability.name] >= ability.limit) return false
  }
  //check if it's in the right zone
  if (ability.fromZone !== "Any") {
    if (ability.fromZone !== getZoneOfCard(ctx.gameState, ctx.thisCard.id)) return false
  }
  //now do state check
  if (ability.stateCheck) {
    if (!ability.stateCheck(ctx)) return false
  }
  //now check for energy in pool
  if (!canSpendEnergy(ctx.gameState.energyPool, ctx.thisAbility.energyCost)) return false
  //todo: maybe preliminary selection checks, to ensure we can meet the minimum amount
  return true
}

export const applyEffect = (ctx: AbilityUsageContext, selections: Selections): GameState => {
  //todo: this function feels very gunky, i miss clojure arrow operators...
  const stateWithEffect = (ctx.thisAbility.effect) ? ctx.thisAbility.effect(ctx, selections) : ctx.gameState
  const stateWithMovedCard = (ctx.thisAbility.toZone) ? moveCardToZone(stateWithEffect, ctx.thisCard.id, ctx.thisAbility.toZone) : stateWithEffect
  const stateWithEnergyUpdated = {
    ...stateWithMovedCard,
    energyPool: spendEnergy(stateWithEffect.energyPool, ctx.thisAbility.energyCost)
  }
  const stateWithMove = {...stateWithEnergyUpdated, moves: ctx.gameState.moves + 1}
  //we need to re-get the card instance because it may have been updated by the effect
  const card = getCardById(stateWithMove, ctx.thisCard.id) 
  const newUsages = card.abilityUsages[ctx.thisAbility.name] + 1
  const stateWithUsage = mutateCard(stateWithMove, card.id, {
    abilityUsages: {
      ...card.abilityUsages,
      [ctx.thisAbility.name]: newUsages
    }
  })
  return stateWithUsage
}