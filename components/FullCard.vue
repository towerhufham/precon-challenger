<template>
  <article class="bg-slate-200 w-128 flex flex-col items-center border-2 border-black rounded-md">
    <p class="font-bold pb-2">{{ card.name }}</p>
    <div v-for="ability of card.abilities" class="border border-black w-full py-1" :key="ability.name">
      <p class="text-center">{{ ability.name }}</p>
      <p class="italic text-center">{{ ability.description }}</p>
    </div>
    <p>{{ card.elements }}</p>
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance } from '~/game';
  const props = defineProps<{card: CardInstance}>()
</script>