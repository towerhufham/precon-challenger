<template>
  <div>
    <!-- Field -->
    <section class="absolute top-0 left-0 flex gap-1">
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

    <div class="w-128 absolute top-0 right-0">
      <!-- Ability Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Ability'">
        <div v-for="ability of interfaceState.card.abilities" :key="ability.name" class="border border-black" 
        :class="canUseAbility({gameState, thisCard: interfaceState.card, thisAbility: ability}) ? 'bg-red-200' : 'bg-slate-200'"
        @click="abilityClickHandler(ability)">
          <p class="font-bold">{{ ability.name }}</p>
          <p>{{ ability.description }}</p>
        </div>
        <div @click="cancelAbility" class="bg-red-100 border border-black">
          Cancel
        </div>
      </div>

      <!-- Selection Chooser -->
      <div v-if="interfaceState.mode === 'Choosing Selections'" class="bg-blue-200">
          
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
    //i think these can be composable/chainable functions!!!
    stateCheck: (ctx: AbilityUsageContext) => {return (getZoneOfCard(ctx.gameState, ctx.thisCard.id) === "Hand")},
    effect: (ctx: AbilityUsageContext, _) => {return moveCardToZone(ctx.gameState, ctx.thisCard.id, "Field")}
  }

  const testCard: CardDefinition = {
    collectionNumber: -1,
    name: "Test Card",
    elements: ["Holy", "Wind"],
    abilities: [simpleSummon]
  }
  const testDrawer: CardDefinition = {
    collectionNumber: -2,
    name: "Test Drawer",
    elements: ["Fire"],
    abilities: [simpleSummon, {
      name: "Draw",
      description: "Draw 1 card",
      limit: 1,
      stateCheck: (ctx: AbilityUsageContext) => {return (getZoneOfCard(ctx.gameState, ctx.thisCard.id) === "Field")},
      effect: (ctx: AbilityUsageContext, _) => {return drawCard(ctx.gameState)}
    }]
  }
  const testMutator: CardDefinition = {
    collectionNumber: -3,
    name: "Mutator",
    elements: ["Water"],
    abilities: [{
      name: "Turn Evil",
      description: "Becomes Dark type (from hand)",
      limit: 1,
      stateCheck: (ctx: AbilityUsageContext) => {return (getZoneOfCard(ctx.gameState, ctx.thisCard.id) === "Hand")},
      effect: (ctx: AbilityUsageContext, _) => {return mutateCard(ctx.gameState, ctx.thisCard.id, {elements: ["Dark"]})}
    }]
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