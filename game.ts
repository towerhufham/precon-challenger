// --------------- Imports --------------- //

import { inPlaceShuffle } from "./utils"
import { reactive } from "vue"

// --------------- Game Constants --------------- //

export const ALL_ELEMENTS = ["Holy", "Fire", "Stone", "Thunder", "Plant", "Wind", "Water", "Dark"] as const
export type Elemental = typeof ALL_ELEMENTS[number]

export const ALL_ZONES = ["Deck", "Hand", "Field", "GY", "Removed"] as const
export type Zone = typeof ALL_ZONES[number]

// --------------- Cards --------------- //

export type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Elemental[]
  abilities: Ability[]
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
  GY: CardInstance[]
  Removed: CardInstance[]
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
  const gs = {
    moves: 0,
    nextId,
    Deck,
    Hand: [],
    Field: [],
    GY: [],
    Removed: []
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
  limit: number | "Unlimited"
  selections?: SelectionCriteria[] | ((ctx: AbilityUsageContext) => SelectionCriteria[])
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effect: (ctx: AbilityUsageContext, selections: Selections) => GameState
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
  amount: number | {min: number, max: number} | "Unlimited"
  allowedElements: "All" | Elemental[]
}

export type Selections = {
  cards?: CardInstance[]
  elements?: Elemental[]
}

export type AbilitySelections = {
  cards?: CardInstance[]
  elements?: Elemental[]
}

export const canUseAbility = (ctx: AbilityUsageContext): boolean => {
  //first check usage limits
  const ability = ctx.thisAbility
  if (ability.limit !== "Unlimited") {
    if (ctx.thisCard.abilityUsages[ability.name] >= ability.limit) return false
  }
  //now do state check
  if (typeof ability.stateCheck === "function") {
    return ability.stateCheck(ctx)
  }
  //todo: maybe preliminary selection checks, to ensure we can meet the minimum amount
  return true
}

export const applyEffect = (ctx: AbilityUsageContext): GameState => {
  //todo: this function feels a bit gunky
  const stateWithEffect = ctx.thisAbility.effect(ctx, {})
  const stateWithMove = {...stateWithEffect, moves: ctx.gameState.moves + 1}
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