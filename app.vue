<template>
  <div class="relative w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
    <!-- Background Pattern -->
    <!-- <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div> -->

    <!-- Field Area -->
    <section class="absolute top-8 left-8 right-8">
      <div class="mb-4">
        <h2 class="text-white text-sm font-semibold tracking-wider uppercase opacity-80">Field</h2>
      </div>
      <div class="flex gap-4 flex-wrap">
        <template v-for="card of gameState.Field">
          <div class="transform transition-all duration-200 hover:scale-105 hover:-translate-y-2">
            <Card :card @click="cardClickHandler(card)"/>
          </div>
        </template>
      </div>
    </section>

    <!-- Hand Area -->
    <section class="absolute bottom-8 left-8 right-96">
      <div class="mb-4">
        <h2 class="text-white text-sm font-semibold tracking-wider uppercase opacity-80">Your Hand</h2>
      </div>
      <div class="flex gap-4 flex-wrap">
        <template v-for="card of gameState.Hand">
          <div class="transform transition-all duration-200 hover:scale-105 hover:-translate-y-2">
            <Card :card @click="cardClickHandler(card)"/>
          </div>
        </template>
      </div>
    </section>

    <!-- Energy Pool -->
    <div class="absolute bottom-8 right-8">
      <div class="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <h3 class="text-white text-sm font-semibold mb-2 tracking-wider uppercase">Energy Pool</h3>
        <ElementalIcons :energy-pool="gameState.energyPool"/>
      </div>
    </div>

    <!-- Side Panel -->
    <div class="absolute top-8 right-8 w-80">
      <!-- Ability Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Ability'" class="bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <h3 class="text-white font-bold text-lg">Choose an Ability</h3>
        </div>
        <div class="p-2">
          <div v-for="ability of interfaceState.card.abilities" :key="ability.name" 
               class="m-2 rounded-lg border transition-all duration-200 cursor-pointer"
               :class="canUseAbility({gameState, thisCard: interfaceState.card, thisAbility: ability}) 
                 ? 'bg-gradient-to-r from-slate-700 to-slate-600 border-blue-400 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/20' 
                 : 'bg-slate-800/50 border-slate-600 opacity-50 cursor-not-allowed'" 
               @click="abilityClickHandler(ability)">
            <div class="p-4">
              <p class="font-bold text-white mb-2">{{ ability.name }}</p>
              <div class="mb-3">
                <ElementalIcons :energy-pool="ability.energyCost"/>
              </div>
              <p class="text-gray-300 text-sm">{{ ability.description }}</p>
            </div>
          </div>
          <div @click="cancelAbility" 
               class="m-2 bg-gradient-to-r from-red-700 to-red-600 rounded-lg border border-red-400 p-4 cursor-pointer hover:border-red-300 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200">
            <p class="text-white font-semibold text-center">Cancel</p>
          </div>
        </div>
      </div>

      <!-- Selection Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Selections'" class="bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <h3 class="text-white font-bold text-lg mb-4">Make Your Selection</h3>
        <!-- Selection content here -->
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  import type { CardDefinition, GameState, AbilityUsageContext, Selections, CardInstance, Ability, SelectionCriteria  } from './game';
  import { initGameState, getCardById, getZoneOfCard, moveCardToZone, drawCard, canUseAbility, applyEffect, mutateCard } from './game';

  const simpleSummon: Ability = {
    name: "Simple Summon",
    description: "Moves from hand to field",
    limit: 1,
    energyCost: {},
    fromZone: "Hand",
    toZone: "Field"
  }

  const testCard: CardDefinition = {
    collectionNumber: -1,
    name: "Test Card",
    elements: ["Holy", "Wind"],
    abilities: [simpleSummon],
    power: 100,
    maxPower: "Unlimited"
  }
  const testDrawer: CardDefinition = {
    collectionNumber: -2,
    name: "Test Drawer",
    elements: ["Fire"],
    abilities: [simpleSummon, {
      name: "Draw",
      description: "Draw 1 card",
      limit: 1,
      energyCost: {"Holy": 1},
      fromZone: "Field",
      effect: (ctx: AbilityUsageContext, _) => {return drawCard(ctx.gameState)}
    }],
    power: 50,
    maxPower: 250
  }
  const testMutator: CardDefinition = {
    collectionNumber: -3,
    name: "Mutator",
    elements: ["Water"],
    abilities: [{
      name: "Turn Evil",
      description: "Becomes Dark type (from hand)",
      limit: 1,
      energyCost: {"Dark": 1},
      fromZone: "Hand",
      effect: (ctx: AbilityUsageContext, _) => {return mutateCard(ctx.gameState, ctx.thisCard.id, {elements: ["Dark"]})}
    }],
    power: 200,
    maxPower: 500
  }

  const decklist = [
    {...testCard},
    {...testCard},
    {...testCard},
    {...testCard},
    {...testMutator},
    {...testMutator},
    {...testDrawer},
    {...testDrawer},
    {...testDrawer},
    {...testDrawer},
  ]

  const gameState: Ref<GameState> = ref(initGameState(decklist))
  //cheat in some energy
  gameState.value.energyPool = {
    ...gameState.value.energyPool,
    "Holy": 3,
    "Plant": 1,
    "Dark": 2
  }

  type InterfaceState = {
    mode: "Standby"
  } | {
    mode: "Choosing Ability"
    card: CardInstance
  } | {
    mode: "Choosing Selections"
    ctx: AbilityUsageContext,
    criteria: SelectionCriteria[]
  }
  const interfaceState: Ref<InterfaceState> = ref({mode: "Standby"})

  const cardClickHandler = (card: CardInstance) => {
    if (interfaceState.value.mode !== "Standby") return
    interfaceState.value = {mode: "Choosing Ability", card}
  }

  const abilityClickHandler = (ability: Ability) => {
    if (interfaceState.value.mode !== "Choosing Ability") return
    const ctx = {
      gameState: gameState.value,
      thisCard: interfaceState.value.card,
      thisAbility: ability
    }
    if (!canUseAbility(ctx)) return 
    if (ability.selections) {
      //set interface to choosing selections
      const criteria = (typeof ability.selections === "function") ? ability.selections(ctx) : ability.selections
      interfaceState.value = {mode: "Choosing Selections", ctx, criteria}
    } else {
      //no selections needed, do eff
      console.dir(gameState.value)
      gameState.value = applyEffect(ctx)
      console.dir(gameState.value)
      interfaceState.value = {mode: "Standby"}
    }
  }

  const cancelAbility = () => {
    interfaceState.value = {mode: "Standby"}
  }
</script>