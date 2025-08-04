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
    case "Has Element":
      return card.elements.includes(criteria.el)
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

export const moveCardsByCriteria = (gs: GameState, criteria: CardCriteria[], to: Zone): GameState => {
  const cards = getCardsByCriteria(gs, criteria)
  return cards.reduce((tempGs, c) => moveCardToZone(tempGs, c.id, to), gs)
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
  | {type: "Add One Energy", el: Elemental}
  | {type: "Add Selected Energy"}
  //| {type: "Add Many Energy", pool: Partial<EnergyPool>} 
  //| {type: "Remove Many Energy", pool: Partial<EnergyPool>} //i wonder if it makes sense to use this for ability activation costs, or if that should be separate?
//todo: mutations and card spawning

export type CardCriteria = {type: "In Zone", zone: Zone}
  | {type: "Has Element", el: Elemental}
  //| {type: "NOT", criteria: CardCriteria}
  //| {type: "NONE", criteria: CardCriteria[]}
  //| {type: "ANY", criteria: CardCriteria[]}
  //| {type: "ALL", criteria: CardCriteria[]}

export type Ability = {
  name: string
  description: string
  energyCost: Partial<EnergyPool> //todo: any energy, doubling costs, etc
  limit: number | "Unlimited"
  fromZone: Zone | "Any"
  selectionCriteria?: SelectionCriteria //[] | ((ctx: AbilityUsageContext) => SelectionCriteria[])
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effects: EffectUnit[]
}

export type AbilityUsageContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type SelectionCriteria = CardSelectionCriteria | ElementalSelectionCriteria

export type CardSelectionCriteria = {
  //todo: roll CardCriteria into this
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

export const addEnergy = (pool: EnergyPool, add: Partial<EnergyPool>): EnergyPool => {
  return D.mapWithKey(pool, (k, v) => v + (add[k] ?? 0))
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

export const applyEffectUnit = (ctx: AbilityUsageContext, eff: EffectUnit, selections: Selections): GameState => {
  const gs = ctx.gameState
  const card = ctx.thisCard
  //const selections = ???
  switch (eff.type) {
    case "Summon This":
      return moveCardToZone(gs, card.id, "Field")
    case "Move This":
      return moveCardToZone(gs, card.id, eff.to)
    case "Move Selected":
      return moveCardToZone(gs, selections.card!.id, eff.to)
    case "Move All":
      return moveCardsByCriteria(gs, eff.criteria, eff.to)
    case "Add One Energy":
      //todo: addOneEnergy(), or maybe addOneItem()
      return {
        ...gs,
        energyPool: {
          ...gs.energyPool,
          [eff.el]: gs.energyPool[eff.el] + 1
        }
      }
    case "Add Selected Energy":
      return {
        ...gs,
        energyPool: {
          ...gs.energyPool,
          [selections.element!]: gs.energyPool[selections.element!] + 1
        }
      }
  }
}

export const applyAbility = (ctx: AbilityUsageContext, selections: Selections): GameState => {
  const ability = ctx.thisAbility
  const card = ctx.thisCard
  return pipe(
    ctx.gameState,
    //apply effect units generated by the ability
    gs => ability.effects.reduce(
      (tempGs, eff) => applyEffectUnit({...ctx, gameState: tempGs}, eff, selections), 
      gs),
    //update energy pool & increment moves
    gs => ({
      ...gs,
      energyPool: spendEnergy(gs.energyPool, ability.energyCost),
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

//I think now that cards should be completely functionless and just be flat values
//That makes writing the abilities easier, as well as handling the logic easier
//Also, global/named/level-having abilities is a good idea, I think (could also probably merge Ability and Trigger in that case)
//Elements -> Attributes
//Summoning (or spells) based on Attribute sacrifice should be coded into the game as a mechanic (and sending to field is different)
//Conversely, that means being tributed is also a mechanic that might have special rules
//I think this kind of hyper-focusing onto the Quasi-Yugioh style gameplay I imagine is really good for both the game design and the code  
//Locks instead of ability usages is probably a good idea, also both for design and code (maybe abilities have a lockStyle?)