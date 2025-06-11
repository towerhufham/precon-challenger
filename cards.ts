import type { CardDefinition, Ability } from "./game"
import { moveCardToZone } from "./game"

// --------------- Abilities --------------- //

export const simpleSummon: Ability = {
  name: "Simple Summon",
  description: "Moves from hand to field",
  limit: 1,
  energyCost: {},
  fromZone: "Hand",
  toZone: "Field"
}

// --------------- Cards -------------- //

export const superFallingStar: CardDefinition = {
  collectionNumber: 1,
  name: "Super Falling Star",
  elements: ["Stone"],
  abilities: [{
    name: "Chromatic Prism",
    description: "Gain one energy of any type.",
    energyCost: {"Stone": 1},
    limit: "Unlimited",
    fromZone: "Hand",
    toZone: "GY",
    selectionCriteria: {type: "Element", allowedElements: "All"},
    effect: (ctx, selections) => {
      const chosenElement = selections.element! //todo: more typesafe way of doing this?
      //definitely needs an addEnergy() helper
      return {
        ...ctx.gameState,
        energyPool: ctx.gameState.energyPool = {
          ...ctx.gameState.energyPool,
          [chosenElement]: ctx.gameState.energyPool[chosenElement] + 1
        }
      }
    }
  }]
}

export const sunRiser: CardDefinition = {
  collectionNumber: 2,
  name: "Sunriser",
  elements: ["Holy", "Stone"],
  abilities: [{
    name: "Second Runrise",
    description: "Return all Stone-type cards from your GY to your Hand.",
    energyCost: {"Holy": 3},
    limit: "Unlimited",
    fromZone: "Extra",
    effect: (ctx, _) => {
      //todo: can make a moveAll() helper function
      let newGs = {...ctx.gameState}
      for (const c of ctx.gameState.GY) {
        if (c.elements.includes("Stone")) {
          newGs = moveCardToZone(newGs, c.id, "Hand")
        }
      }
      return newGs
    }
  }]
}

export const bennyTheBouncer: CardDefinition = {
  collectionNumber: -1,
  name: "Benny the Bouncer",
  elements: ["Dark"],
  abilities: [simpleSummon, {
    name: "Get 'em outta here!",
    description: "Move target card from the Field to the Hand.",
    energyCost: {"Dark": 1},
    limit: "Unlimited",
    fromZone: "Field",
    selectionCriteria: {
      type: "Card",
      zones: ["Field"],
      cardCriteria: () => true
    },
    effect: (ctx, selections) => {
      return moveCardToZone(ctx.gameState, selections.card!.id, "Hand")
    }
  }]
}
