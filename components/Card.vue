<!-- Card Component -->
<template>
  <article class="relative w-36 h-52 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-xl cursor-pointer"
           :class="[
             card.maxPower === 0 ? 'border-gray-600' : 'border-slate-700',
           ]"
           :style="getElementalBackground(card.elements)">
    <!-- Card Glow Effect -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
    
    <!-- Card Content -->
    <div class="relative h-full flex flex-col justify-between p-3">
      <!-- Card Name -->
      <div class="text-center">
        <h3 class="font-bold text-white text-lg drop-shadow-lg bg-black/30 rounded px-2 py-1 backdrop-blur-sm">
          {{ card.name }}
        </h3>
      </div>
      
      <!-- Card Image Area -->
      <div class="flex-1 flex items-center justify-center my-2">
        <div class="w-24 h-24 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
          <span class="text-white/50 text-xs">Image</span>
        </div>
      </div>
      
      <!-- Power Stats -->
      <div class="bg-black/60 backdrop-blur-sm rounded-lg p-2">
        <div class="text-center">
          <span class="text-2xl font-bold text-white">{{ card.power }}</span>
          <span class="text-xl text-white/80 mx-1">/</span>
          <span class="text-2xl font-bold text-white">{{ card.maxPower === "Unlimited" ? "∞" : card.maxPower }}</span>
        </div>
      </div>
    </div>
    
    <!-- Shine Effect -->
    <div class="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance } from '~/game';
  import { getElementalBackground } from '~/elementalStyles';
  const props = defineProps<{card: CardInstance}>()
</script>