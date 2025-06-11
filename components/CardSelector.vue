<template>
  <div>
    <p>Select card:</p>
    <section v-for="zone of props.criteria.zones" :key="zone">
      <p class="font-bold">{{ zone }}:</p>
      <div class="flex gap-2">
        <template v-for="card of gs[zone]" :key="card.id">
          <template v-if="criteria.cardCriteria(card)">
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
  import type { CardInstance, CardSelectionCriteria, GameState } from '~/game';
  const props = defineProps<{criteria: CardSelectionCriteria, gs: GameState}>()
  const model = defineModel<CardInstance|null>()
</script>