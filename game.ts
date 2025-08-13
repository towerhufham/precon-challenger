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
  selectionCriteria?: SelectionCriteria //[] | ((ctx: AbilityUsageContext) => SelectionCriteria[])
  stateCheck?: (ctx: AbilityUsageContext) => boolean
  effects: EffectUnit[]
}

export type AbilityUsageContext = {
  gameState: GameState
  thisCard: CardInstance
  thisAbility: Ability
}

export type SelectionCriteria = CardSelectionCriteria | AttributeSelectionCriteria

export type CardSelectionCriteria = {
  //todo: roll CardCriteria into this
  type: "Card"
  zones: Zone[]
  selfTarget: boolean
  cardCriteria: (card: CardInstance) => boolean
}

export type AttributeSelectionCriteria = {
  type: "Attribute"
  allowedAttributes: Attribute[]
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

export const applyEffectUnit = (ctx: AbilityUsageContext, eff: EffectUnit, selections: Selections): GameState => {
  const gs = ctx.gameState
  const card = ctx.thisCard
  switch (eff.type) {
    case "Summon This":
      return moveCardToZone(gs, card.id, "Field")
    case "Move This":
      return moveCardToZone(gs, card.id, eff.to)
    case "Move Selected":
      return moveCardToZone(gs, selections.card!.id, eff.to)
    case "Move All":
      return moveCardsByCriteria(gs, eff.criteria, eff.to)
    case "Draw":
      return drawCard(gs)
    case "Draw by Criteria":
      return drawCardByCriteria(gs, eff.criteria)
    default:
      throw eff satisfies never
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
    //increment moves
    gs => ({...gs, moves: gs.moves+1}),
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