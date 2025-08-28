<template>
  <div>
    <p>Select card:</p>
    <section v-for="zone of ALL_ZONES" :key="zone">
      <p class="font-bold">{{ zone }}:</p>
      <div class="flex gap-2">
        <template v-for="card of ctx.gameState[zone]" :key="card.id">
          <template v-if="canShowCard(card)">
            <Card :card
              :class="{'border-4 border-white box-border': model?.id === card.id}"
              @click="model?.id === card.id ? model = null : model = card"/>
          </template>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import type { CardInstance, CardCriteria } from '~/game';
  import { checkCriteria, ALL_ZONES } from '~/game';
  import type { AbilityContext } from '~/ability';
  const props = defineProps<{criteria: CardCriteria[], ctx: AbilityContext}>()
  const model = defineModel<CardInstance|null>()
  const canShowCard = (card: CardInstance) => checkCriteria(props.ctx.gameState, card, props.criteria)
</script>