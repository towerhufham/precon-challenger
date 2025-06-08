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
        <div @click="cancelAbility" class="bg-red-200 border border-black">
          Cancel
        </div>
      </div>

      <!-- Selection Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Selections'">
        <div class="w-128 absolute top-[30vh] right-[25vw] w-[50vw] h-[30vh] bg-blue-200 overflow-y-scroll border border-black">
          <section v-for="criteria of interfaceState.criteria" class="border border-black">
            <!-- Choosing Elements -->
            <div v-if="criteria.type === 'Element'">
              <ElementSelector :criteria/>
            </div>
          </section>
          <button class="bg-blue-400 p-2 rounded-md">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { GameState, AbilityUsageContext, Selections, CardInstance, Ability, SelectionCriteria  } from './game';
  import { initGameState, spawnCardTo, canUseAbility, applyEffect } from './game';
  import { superFallingStar, sunRiser } from "./cards";

  const decklist = [
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
    {...superFallingStar},
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