<template>
  <template class="flex">
    <template v-for="([el, amount], index) in Object.entries(props.energyPool)" :key="index">
      <template v-for="_ in amount">
        <ElementalIcon :elemental="(el as Elemental)" :size/>
      </template>
    </template>
  </template>
</template>

<script setup lang="ts">
  import type { Elemental, EnergyPool } from '../game';
  const props = defineProps<{
    energyPool: Partial<EnergyPool>,
    size: string
  }>()
</script>