import type { CardDefinition, Ability } from "./game"

// --------------- Helpers --------------- //

const simpleSummon: Ability = {
  name: "Simple Summon",
  description: "Summon this card to the field.",
  category: {type: "Activated"},
  limit: "Unlimited",
  fromZone: "Hand",
  effects: [{type: "Summon This"}]
}

// --------------- Cards -------------- //

export const superFallingStar: CardDefinition = {
  collectionNumber: 1,
  name: "Super Falling Star",
  attributes: ["Eggs"],
  color: "white",
  abilities: [{
    name: "Chromatic Prism",
    description: "Send this to the GY.",
    category: {type: "Activated"},
    limit: "Unlimited",
    fromZone: "Hand",
    effects: [
      {type: "Move This", to: "GY"},
    ]
  }, {
    name: "Shine",
    description: "When this card is sent to the GY, draw 1 [Eggs] card.",
    category: {type: "Triggered", to: "GY"},
    limit: "Unlimited",
    fromZone: "Any",
    effects: [
      {type: "Draw by Criteria", criteria: [{type: "Has Attribute", attribute: "Eggs"}]}
    ]
  }]
}

export const sunRiser: CardDefinition = {
  collectionNumber: 2,
  name: "Sunriser",
  attributes: ["Eggs"],
  color: "orange",
  abilities: [{
    name: "Second Sunrise",
    description: "Return all [Eggs] cards from your GY to your Hand.",
    category: {type: "Activated"},
    limit: "Unlimited",
    fromZone: "Extra",
    effects: [{
      type: "Move All",
      to: "Hand",
      criteria: [
        {type: "In Zone", zone: "GY"},
        {type: "Has Attribute", attribute: "Eggs"}
      ]
    }]
  }]
}

export const bennyTheBouncer: CardDefinition = {
  collectionNumber: -1,
  name: "Benny the Bouncer",
  attributes: ["Evil"],
  color: "violet",
  abilities: [simpleSummon, {
    name: "Get 'em outta here!",
    description: "Move target card from the Field to the Hand.",
    category: {type: "Activated"},
    limit: "Unlimited",
    fromZone: "Field",
    selectionCriteria: [{type: "In Zone", zone: "Field"}],
    effects: [{type: "Move Selected", to: "Hand"}]
  }]
}

export const weirdoTrain: CardDefinition = {
  collectionNumber: -2,
  name: "Weirdo Train",
  color: "blue",
  attributes: ["Magic"],
  abilities: [simpleSummon]
}

export const varna: CardDefinition = {
  collectionNumber: -3,
  name: "Varna",
  color: "red",
  attributes: ["Magic"],
  abilities: [simpleSummon]
}