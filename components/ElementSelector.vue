<template>
  <!-- Todo: maybe different criteria need to be different types -->
  <!-- that way we can validate at the prop level -->
  <!-- though there might be a cooler way of doing that with TS -->
  <div v-if="criteria.type === 'Element'">
    <p>Select element:</p>
    <div class="flex gap-4">
      <ElementalIcon 
        v-for="el of ALL_ELEMENTS"
        :elemental="el" 
        size="3em" 
        :class="{
          'text-slate-300': !shownElements.includes(el), 
          'text-white': selected === el,
          'hover:text-slate-600': selected !== el
        }"
        @click="selected = el"/>
        <p v-if="selected" @click="selected = null" class="hover:text-slate-600 cursor-pointer">(Deselect)</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ALL_ELEMENTS } from '~/game';
  import type { Elemental, SelectionCriteria } from '~/game';
  const props = defineProps<{criteria: SelectionCriteria}>()
  const shownElements = computed(() => {
    //error, see top comment
    if (props.criteria.type !== "Element") return []
    return props.criteria.allowedElements === "All"
      ? ALL_ELEMENTS
      : props.criteria.allowedElements
  })
  const selected: Ref<Elemental|null> = ref(null)
</script>