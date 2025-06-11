<template>
  <div>
    <!-- Debug -->
     <div class="absolute top-0 left-[45vw]">
       <p>interfaceState: {{ interfaceState.mode }}</p>
     </div>
    <!-- Extra -->
     <section class="absolute top-0 left-0 flex gap-1">
      <template v-for="card of gameState.Extra">
        <Card :card @click="cardClickHandler(card)"/>
      </template>
    </section>
    <!-- Field -->
    <section class="absolute top-[35vh] left-0 flex gap-1">
      <template v-for="card of gameState.Field">
        <Card :card @click="cardClickHandler(card)"/>
      </template>
    </section>
    <!-- Hand -->
    <section class="absolute bottom-0 left-0 flex gap-1">
      <template v-for="card of gameState.Hand">
        <Card :card @click="cardClickHandler(card)"/>
      </template>
    </section>

    <!-- Energy -->
    <div class="absolute bottom-0 right-0">
      <ElementalIconList :energy-pool="gameState.energyPool" size="3em"/>
    </div>

    <div class="w-128 absolute top-0 right-0">
      <!-- Ability Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Ability'">
        <div v-for="ability of interfaceState.card.abilities" :key="ability.name" class="border border-black" 
        :class="canUseAbility({gameState, thisCard: interfaceState.card, thisAbility: ability}) ? 'bg-white' : 'bg-slate-200'" @click="abilityClickHandler(ability)">
          <p class="font-bold">{{ ability.name }}</p>
          <ElementalIconList :energy-pool="ability.energyCost" size="1.5em"/>
          <p>{{ ability.description }}</p>
        </div>
        <div @click="endAbility" class="bg-red-200 border border-black">
          Cancel
        </div>
      </div>

      <!-- Selection Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Selections'">
        <div class="w-128 absolute top-[30vh] right-[25vw] w-[50vw] h-[30vh] bg-blue-200 overflow-y-scroll border border-black">
          <!-- Choosing Elements -->
          <button class="bg-red-400 p-2 rounded-md" @click="endAbility">Cancel</button>
          <div v-if="interfaceState.criteria.type === 'Element'">
            <ElementSelector :criteria="interfaceState.criteria" v-model="selectedElement"/>
          </div>
          <div v-else-if="interfaceState.criteria.type === 'Card'">
            <CardSelector :criteria="interfaceState.criteria" :ctx="interfaceState.ctx" v-model="selectedCard"/>
          </div>
          <button class="bg-blue-400 p-2 rounded-md" @click="confirmAbilityWithSelections">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { GameState, AbilityUsageContext, Elemental, CardInstance, Ability, SelectionCriteria, Selections  } from './game';
  import { initGameState, spawnCardTo, canUseAbility, applyEffect } from './game';
  import { superFallingStar, sunRiser, bennyTheBouncer } from "./cards";

  const decklist = [
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...bennyTheBouncer},
    {...bennyTheBouncer},
    {...bennyTheBouncer},
    {...bennyTheBouncer},
  ]

  const gameState: Ref<GameState> = ref(initGameState(decklist))
  //cheat in some energy
  gameState.value.energyPool = {
    ...gameState.value.energyPool,
    "Holy": 3,
    "Stone": 5
  }
  //add some starting extras
  gameState.value = spawnCardTo(gameState.value, sunRiser, "Extra")

  const selectedElement: Ref<Elemental|null> = ref(null)
  const selectedCard: Ref<CardInstance|null> = ref(null)

  type InterfaceState = {
    mode: "Standby"
  } | {
    mode: "Choosing Ability"
    card: CardInstance
  } | {
    mode: "Choosing Selections"
    ctx: AbilityUsageContext,
    criteria: SelectionCriteria
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
    if (ability.selectionCriteria) {
      //set interface to choosing selections
      //const criteria = (typeof ability.selections === "function") ? ability.selections(ctx) : ability.selections
      const criteria = ability.selectionCriteria //for now
      interfaceState.value = {mode: "Choosing Selections", ctx, criteria}
    } else {
      //no selections needed, do eff
      gameState.value = applyEffect(ctx, {})
      endAbility()
    }
  }

  const confirmAbilityWithSelections = () => {
    if (interfaceState.value.mode !== "Choosing Selections") {
      throw new Error("UI ERROR: calling confirmAbilityWithSelections() while not in Choosing Selections state")
    }
    const selections: Selections = {
      element: selectedElement.value || undefined,
      card: selectedCard.value || undefined
    }
    gameState.value = applyEffect(interfaceState.value.ctx, selections)
    //clear selections & go to standby
    endAbility()
  }

  const endAbility = () => {
    selectedElement.value = null
    selectedCard.value = null
    interfaceState.value = {mode: "Standby"}
  }
</script>