// --------------- Imports --------------- //

import * as R from "remeda"
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
  // Using Remeda to create object from array of keys
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
  let nextId = 0
  const deck: CardInstance[] = []
  for (const cardDef of decklist) {
    deck.push(instantiateCard(cardDef, nextId))
    nextId++
  }
  
  // Create shuffled copy instead of in-place mutation for purity
  const shuffledDeck = [...deck]
  inPlaceShuffle(shuffledDeck) // This is the only impure operation we keep
  
  const initialState: GameState = {
    moves: 0,
    nextId: deck.length,
    Deck: shuffledDeck,
    Hand: [],
    Field: [],
    Extra: [],
    GY: [],
    Removed: [],
    energyPool: makeEmptyEnergyPool(),
  }
  
  // Draw 5 cards using composition instead of nested calls
  return R.pipe(
    initialState,
    drawCard,
    drawCard,
    drawCard,
    drawCard,
    drawCard
  )
}

export const instantiateCard = (definition: CardDefinition, id: number): CardInstance => {
  // Use Remeda to create abilityUsages object from abilities array
  let abilityUsages: {[abilityName: string]: number} = {}
  for (const ability of definition.abilities) {
    abilityUsages[ability.name] = 0
  }
  
  return {
    ...definition,
    id,
    abilityUsages
  }
}

export const spawnCardTo = (gs: GameState, definition: CardDefinition, to: Zone): GameState => {
  const newCard = instantiateCard(definition, gs.nextId)
  
  return {
    ...gs,
    nextId: gs.nextId + 1,
    [to]: [...gs[to], newCard]
  }
}

export const drawCard = (gs: GameState): GameState => {
  // Use Remeda's first() for safer access
  const topDeck = R.first(gs.Deck)
  
  return topDeck 
    ? moveCardToZone(gs, topDeck.id, "Hand")
    : gs
}

export const getCardById = (gs: GameState, id: number): CardInstance => {
  // Use Remeda's pipe and find across all zones
  const card = R.pipe(
    ALL_ZONES,
    R.flatMap(zone => gs[zone]),
    R.find(card => card.id === id)
  )
  
  if (!card) {
    throw new Error(`GAME ERROR: can't find card instance of id ${id}!`)
  }
  
  return card
}

export const getZoneOfCard = (gs: GameState, id: number): Zone => {
  // Find zone using Remeda's find and some
  const zone = R.find(
    ALL_ZONES,
    zone => gs[zone].some(card => card.id === id)
  )
  
  if (!zone) {
    throw new Error(`GAME ERROR: can't find zone of card with id ${id}!`)
  }
  
  return zone
}

export const moveCardToZone = (gs: GameState, id: number, zone: Zone): GameState => {
  const oldZone = getZoneOfCard(gs, id)
  const card = getCardById(gs, id)
  
  return {
    ...gs,
    // Use Remeda's filter for removing card from old zone
    [oldZone]: R.filter(gs[oldZone], c => c.id !== id),
    // Append card to new zone
    [zone]: [...gs[zone], card]
  }
}

export const mutateCard = (gs: GameState, id: number, mutations: Partial<CardInstance>): GameState => {
  if ("id" in mutations) {
    throw new Error(`GAME ERROR: trying to mutate card with id ${id} into having id ${mutations.id}!`)
  }
  
  const zone = getZoneOfCard(gs, id)
  const card = getCardById(gs, id)
  
  // Use Remeda's map to update the specific card in the zone
  const updatedZone = R.map(
    gs[zone],
    c => c.id === id 
      ? { ...c, ...mutations }
      : c
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
  energyCost: Partial<EnergyPool>
  limit: number | "Unlimited"
  fromZone: Zone | "Any"
  toZone?: Zone
  selectionCriteria?: SelectionCriteria
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
  for (const el of Object.keys(cost) as Array<Elemental>) {
    //if it's less than what's required, it can't be paid
    if (pool[el] < cost[el]!) return false
  }
  //if we make it here, it's payable
  return true
}

export const spendEnergy = (pool: EnergyPool, cost: Partial<EnergyPool>): EnergyPool => {
  if (!canSpendEnergy(pool, cost)) {
    throw new Error(`GAME ERROR: Trying to spend ${JSON.stringify(cost)} but pool only has ${JSON.stringify(pool)}!`)
  }
  
  // Use Remeda's mapValues for cleaner energy subtraction
  return R.pipe(
    pool,
    R.mapValues((value, key) => 
      value - (cost[key as Elemental] ?? 0)
    )
  ) as EnergyPool
}

export const canUseAbility = (ctx: AbilityUsageContext): boolean => {
  const { thisAbility, thisCard, gameState } = ctx
  
  // Create array of checks and use Remeda's every
  const checks = [
    // Check usage limits
    () => thisAbility.limit === "Unlimited" || 
          thisCard.abilityUsages[thisAbility.name] < thisAbility.limit,
    
    // Check zone
    () => thisAbility.fromZone === "Any" || 
          thisAbility.fromZone === getZoneOfCard(gameState, thisCard.id),
    
    // Check state
    () => !thisAbility.stateCheck || thisAbility.stateCheck(ctx),
    
    // Check energy
    () => canSpendEnergy(gameState.energyPool, thisAbility.energyCost)
  ]
  
  return checks.every(check => check())
}

export const applyAbility = (ctx: AbilityUsageContext, selections: Selections): GameState => {
  const { thisAbility, thisCard, gameState } = ctx
  
  // Use Remeda's pipe for composing state transformations
  return R.pipe(
    gameState,
    // Apply effect if it exists
    gs => thisAbility.effect ? thisAbility.effect(ctx, selections) : gs,
    // Move card if toZone is specified
    gs => thisAbility.toZone ? moveCardToZone(gs, thisCard.id, thisAbility.toZone) : gs,
    // Update energy pool
    gs => ({
      ...gs,
      energyPool: spendEnergy(gs.energyPool, thisAbility.energyCost)
    }),
    // Increment moves
    gs => ({
      ...gs,
      moves: gs.moves + 1
    }),
    // Update ability usage count
    gs => {
      const updatedCard = getCardById(gs, thisCard.id)
      const newUsages = updatedCard.abilityUsages[thisAbility.name] + 1
      
      return mutateCard(gs, updatedCard.id, {
        abilityUsages: {
          ...updatedCard.abilityUsages,
          [thisAbility.name]: newUsages
        }
      })
    }
  )
}