// --------------- Imports --------------- //

import { pipe, D, A, O } from "@mobily/ts-belt"
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
  return pipe(
    ALL_ELEMENTS,
    A.map(el => [el, 0] as const),
    D.fromPairs
  ) as EnergyPool
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
    energyPool: makeEmptyEnergyPool(),
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
    A.head(gs.Deck),
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

export type Ability = {
  name: string
  description: string
  energyCost: Partial<EnergyPool> //todo: any energy, doubling costs, etc
  limit: number | "Unlimited"
  fromZone: Zone | "Any"
  toZone?: Zone
  selectionCriteria?: SelectionCriteria //[] | ((ctx: AbilityUsageContext) => SelectionCriteria[])
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effect?: (ctx: AbilityUsageContext, selections: Selections) => GameState
}

export type AbilityUsageContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type SelectionCriteria = CardSelectionCriteria | ElementalSelectionCriteria

export type CardSelectionCriteria = {
  type: "Card"
  zones: Zone[]
  selfTarget: boolean
  cardCriteria: (card: CardInstance) => boolean
}

export type ElementalSelectionCriteria = {
  type: "Element"
  allowedElements: "All" | Elemental[]
}

export type Selections = {
  card?: CardInstance
  element?: Elemental
}

export const canSpendEnergy = (pool: EnergyPool, cost: Partial<EnergyPool>): boolean => {
  return pipe(
    D.keys(cost),
    A.every(el => pool[el] >= cost[el]!),
  )
}

export const spendEnergy = (pool: EnergyPool, cost: Partial<EnergyPool>): EnergyPool => {
  //if we don't have enough, error
  if (!canSpendEnergy(pool, cost)) throw new Error(`GAME ERROR: Trying to spend ${JSON.stringify(cost)} but pool only has ${JSON.stringify(pool)}!`)
  return pipe(
    pool,
    D.mapWithKey((key, val) => 
      (val - (cost[key] ?? 0))
    )
  )
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
      //make sure there's enough energy in pool
      () => canSpendEnergy(gs.energyPool, ability.energyCost)
      //todo: maybe preliminary selection checks, to ensure we can meet the minimum amount
    ], (check => check())
  )
}

export const applyAbility = (ctx: AbilityUsageContext, selections: Selections): GameState => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  return pipe(
    ctx.gameState,
    //apply effect, if present
    gs => ability.effect ? ability.effect(ctx, selections) : gs,
    //move card, if ability has toZone
    gs => ability.toZone ? moveCardToZone(gs, card.id, ability.toZone) : gs,
    //update energy pool
    gs => ({
      ...gs,
      energyPool: spendEnergy(gs.energyPool, ability.energyCost)
    }),
    //increment moves
    gs => ({
      ...gs,
      moves: gs.moves+1
    }),
    //mutate card with ability usage
    gs => {
      //we have to re-get the card because the card may have been mutated by its effect
      //i wonder if there's a way to avoid that...
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

