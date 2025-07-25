<template>
  <div class="flex max-screen overflow-hidden">
    <!-- Left panel -->
    <div class="flex flex-col items-stretch gap-6 h-screen w-[350px] overflow-hidden orange-grid-bg border border-8 border-orange-600 text-center p-3">
      <template v-if="interfaceState.mode === 'Choosing Ability'">
        <p class="text-4xl font-bold text-white">
          {{ interfaceState.card.name }}
        </p>
        <template v-for="ability of interfaceState.card.abilities" :key="ability.name">
          <article class="border border-4 border-orange-500 rounded-2xl p-1 bg-orange-800/25"
          :class="canUseAbility({gameState, thisCard: interfaceState.card, thisAbility: ability}) ? 'cursor-pointer' : 'grayscale brightness-50'" 
          @click="abilityClickHandler(ability)">
            <p class="text-2xl font-bold text-white">
              {{ ability.name }}
            </p>
            <div class="flex justify-center my-1">
              <ElementalIconList :energy-pool="ability.energyCost" size="1.5em"/>
            </div>
            <p class="text-sm text-stone-300 italic">
              From {{ ability.fromZone }}
              / {{ ability.limit }} per turn
              {{ ability.toZone ? `/ Sends to ${ability.toZone}` : "" }}
            </p>
            <p class="text-lg text-white">
              {{ ability.description }}
            </p>
          </article>
        </template>
        <article class="border border-4 border-white rounded-2xl p-1 bg-white/25 cursor-pointer" @click="endAbility">
          <p class="text-2xl font-bold text-white">
            Cancel
          </p>
        </article>
      </template>
    </div>

    <!-- Center panel -->
    <div class="flex-grow grid grid-rows-3 h-screen overflow-hidden green-grid-bg">
      <!-- Upper third -->
      <div class="flex justify-center items-center gap-2">
        <template v-for="card of gameState.Extra" :key="card.id">
          <Card :card @click="cardClickHandler(card)"/>
        </template>
      </div>
      <!-- Middle third -->
      <div class="flex justify-center items-center gap-2">
        <template v-for="card of gameState.Field" :key="card.id">
          <Card :card @click="cardClickHandler(card)"/>
        </template>
      </div>
      <!-- Lower third -->
      <div class="flex justify-center items-center gap-2">
        <template v-for="card of gameState.Hand" :key="card.id">
          <Card :card @click="cardClickHandler(card)"/>
        </template>
      </div>
    </div>

    <!-- Right panel -->
    <div class="flex flex-col h-screen w-[350px] overflow-hidden orange-grid-bg border border-8 border-orange-600 p-3">
      <p class="text-4xl font-bold text-white text-center">
        Energy Pool
      </p>
      <ElementalIconList :energy-pool="gameState.energyPool" size="2em" class="mt-3 flex-wrap justify-center"/>
    </div>

    <!-- Selection Chooser -->
    <div v-if="interfaceState.mode === 'Choosing Selections'">
      <div class="w-128 absolute top-[20vh] right-[25vw] w-[50vw] h-[50vh] bg-blue-200 overflow-y-scroll border border-black">
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
</template>

<script setup lang="ts">
  import type { GameState, AbilityUsageContext, Elemental, CardInstance, Ability, SelectionCriteria, Selections  } from './game';
  import { initGameState, spawnCardTo, canUseAbility, applyEffect } from './game';
  import { superFallingStar, sunRiser, bennyTheBouncer, weirdoTrain, varna } from "./cards";

  const decklist = [
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...bennyTheBouncer},
    {...bennyTheBouncer},
    {...bennyTheBouncer},
    {...weirdoTrain},
    {...varna}
  ]

  const gameState: Ref<GameState> = ref(initGameState(decklist))
  //cheat in some energy
  gameState.value.energyPool = {
    ...gameState.value.energyPool,
    "Holy": 3,
    "Stone": 10
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
      const criteria = ability.selectionCriteria //limit of one for now
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

<style scoped>
  .orange-grid-bg {
    --grid-color: rgba(253, 154, 0, 0.15); /* orange-500 */
    background-size: 30px 30px;
    background-color: rgb(29, 41, 61); /* slate-800 */
    background-image:
      linear-gradient(to right, var(--grid-color) 2px, transparent 2px),
      linear-gradient(to bottom, var(--grid-color) 2px, transparent 2px);
  }

  .green-grid-bg {
    --grid-color: rgba(0, 188, 125, 0.15); /* emerald-500 */
    background-size: 20px 20px;
    background-color: rgb(0, 44, 34); /* slate-800 */
    background-image:
      linear-gradient(to right, var(--grid-color) 2px, transparent 2px),
      linear-gradient(to bottom, var(--grid-color) 2px, transparent 2px);
  }
</style>