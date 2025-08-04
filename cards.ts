import type { CardDefinition, Ability } from "./game"

// --------------- Helpers --------------- //

const simpleSummon: Ability = {
  name: "Simple Summon",
  description: "Summon this card to the field.",
  limit: "Unlimited",
  fromZone: "Hand",
  energyCost: {},
  effects: [{type: "Summon This"}]
}

// --------------- Cards -------------- //

export const superFallingStar: CardDefinition = {
  collectionNumber: 1,
  name: "Super Falling Star",
  elements: ["Holy", "Stone"],
  abilities: [{
    name: "Chromatic Prism",
    description: "Gain one energy of any type.",
    energyCost: {"Stone": 1},
    limit: "Unlimited",
    fromZone: "Hand",
    selectionCriteria: {type: "Element", allowedElements: "All"},
    effects: [
      {type: "Add Selected Energy"},
      {type: "Move This", to: "GY"}
    ]
  }]
}

export const sunRiser: CardDefinition = {
  collectionNumber: 2,
  name: "Sunriser",
  elements: ["Holy", "Stone"],
  abilities: [{
    name: "Second Sunrise",
    description: "Return all Stone-type cards from your GY to your Hand.",
    energyCost: {"Holy": 3},
    limit: "Unlimited",
    fromZone: "Extra",
    effects: [{
      type: "Move All",
      to: "Hand",
      criteria: [
        {type: "In Zone", zone: "GY"},
        {type: "Has Element", el: "Stone"}
      ]
    }]
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
      selfTarget: false,
      cardCriteria: () => true
    },
    effects: [{type: "Move Selected", to: "Hand"}]
  }]
}

export const weirdoTrain: CardDefinition = {
  collectionNumber: -2,
  name: "Weirdo Train",
  elements: ["Fire", "Thunder", "Water"],
  abilities: [simpleSummon]
}

export const varna: CardDefinition = {
  collectionNumber: -3,
  name: "Varna",
  elements: ["Holy", "Fire", "Stone", "Thunder", "Plant", "Wind", "Water", "Dark"],
  abilities: [simpleSummon]
}