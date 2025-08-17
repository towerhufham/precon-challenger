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
  abilities: [simpleSummon, {
    name: "Bounce X-tra",
    description: "If this is moved from the Field to the Hand, send this to the Extra.",
    category: {type: "Triggered", from: "Field", to: "Hand"},
    limit: "Unlimited",
    fromZone: "Any", //?
    effects: [{type: "Move This", to: "Extra"}]
  }]
}

export const varna: CardDefinition = {
  collectionNumber: -3,
  name: "Varna",
  color: "red",
  attributes: ["Magic"],
  abilities: [simpleSummon]
}


// fun tests
export const keldo: CardDefinition = {
  collectionNumber: 0,
  name: "Keldo the Sacred Protector",
  color: "darkgoldenrod",
  attributes: ["Pyramidas"],
  abilities: [{
    name: "Toss Summon",
    description: "Send a [Pyramidas] card from your hand to the GY, then summon this.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "Hand",
    selectionCriteria: [
      {type: "In Zone", zone: "Hand"}, 
      {type: "Has Attribute", attribute: "Pyramidas"}
    ],
    effects: [
      {type: "Move Selected", to: "GY"},
      {type: "Move This", to: "Field"}
    ]
  }, {
    name: "Returnal",
    description: "Shuffle a card from the GY into the Deck.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "GY",
    selectionCriteria: [{type: "In Zone", zone: "GY"}],
    effects: [
      {type: "Move Selected", to: "Deck"}
    ]
  }]
}

export const agido: CardDefinition = {
  collectionNumber: 0,
  name: "Agido the Ancient Sentinel",
  color: "darkgoldenrod",
  attributes: ["Pyramidas"],
  abilities: [{
    name: "Clawing On",
    description: "If this card is sent to the GY, mill 3 cards.",
    category: {type: "Triggered", to: "GY"},
    limit: 1,
    fromZone: "Any", //?
    effects: [{type: "Mill"}, {type: "Mill"}, {type: "Mill"}]
  }, {
    name: "Soul Seek",
    description: "Search for a [Pyramidas] card, then delete this.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "GY",
    selectionCriteria: [{type: "Has Attribute", attribute: "Pyramidas"}],
    effects: [
      {type: "Move Selected", to: "Hand"},
      {type: "Move This", to: "Removed"}
    ]
  }]
}

export const havnis: CardDefinition = {
  collectionNumber: 0,
  name: "Tearlaments Havnis",
  attributes: ["Tears"],
  color: "mediumslateblue",
  abilities: [{
    name: "Raging Flow",
    description: "If this card is added from the Deck to the Hand, summon it.",
    category: {type: "Triggered", from: "Deck", to: "Hand"},
    limit: 1,
    fromZone: "Any", //?
    effects: [{type: "Summon This"}]
  }, {
    name: "Tearful Part",
    description: "Send this from the Field to the GY.",
    category: {type: "Activated"},
    fromZone: "Field",
    limit: "Unlimited",
    effects: [{type: "Move This", to: "GY"}]
  }]
}

export const merrli: CardDefinition = {
  collectionNumber: 0,
  name: "Tearlaments Merlli",
  attributes: ["Tears"],
  color: "mediumslateblue",
  abilities: [{
    name: "Bubble Rake",
    description: "Send this card to the GY, then mill 3 cards.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "Hand", //?
    effects: [
      {type: "Move This", to: "GY"},
      {type: "Mill"}, {type: "Mill"}, {type: "Mill"}
    ]
  }, {
    name: "Tearful Part",
    description: "Send this from the Field to the GY.",
    category: {type: "Activated"},
    fromZone: "Field",
    limit: "Unlimited",
    effects: [{type: "Move This", to: "GY"}]
  }]
}

export const scheiren: CardDefinition = {
  collectionNumber: 0,
  name: "Tearlaments Scheiren",
  attributes: ["Tears"],
  color: "mediumslateblue",
  abilities: [{
    name: "Pressure Drop",
    description: "Send a [Tears] card from the Hand to the GY, then summon this card.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "Hand", //?
    selectionCriteria: [
      {type: "In Zone", zone: "Hand"}, 
      {type: "Has Attribute", attribute: "Tears"}
    ],
    effects: [
      {type: "Move Selected", to: "GY"},
      {type: "Summon This"}
    ]
  }, {
    name: "Tearful Part",
    description: "Send this from the Field to the GY.",
    category: {type: "Activated"},
    fromZone: "Field",
    limit: "Unlimited",
    effects: [{type: "Move This", to: "GY"}]
  }]
}

export const reinoheart: CardDefinition = {
  collectionNumber: 0,
  name: "Tearlaments Reinoheart",
  attributes: ["Tears"],
  color: "mediumslateblue",
  abilities: [{
    name: "Lock-heart",
    description: "Send a [Tears] card from the Deck to the GY, then summon this card.",
    category: {type: "Activated"},
    limit: 1,
    fromZone: "Hand", //?
    selectionCriteria: [
      {type: "In Zone", zone: "Deck"}, 
      {type: "Has Attribute", attribute: "Tears"}
    ],
    effects: [
      {type: "Move Selected", to: "GY"},
      {type: "Summon This"}
    ]
  }, {
    name: "Bounceback",
    description: "If this card is sent to the GY, move it to the Field.",
    category: {type: "Triggered", to: "GY"},
    fromZone: "Any",
    limit: 1,
    effects: [{type: "Move This", to: "Field"}]
  }]
}