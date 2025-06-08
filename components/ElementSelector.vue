<template>
  <!-- Todo: maybe different criteria need to be different types -->
  <!-- that way we can validate at the prop level -->
  <!-- though there might be a cooler way of doing that with TS -->
  <div v-if="criteria.type === 'Element'">
    <p>Select element:</p>
    <div class="flex gap-4 items-center">
      <ElementalIcon 
        v-for="el of ALL_ELEMENTS"
        :elemental="el" 
        size="3em" 
        :class="{
          'grayscale': !shownElements.includes(el), 
          'border-4 border-white box-border': selected === el,
        }"
        class="cursor-pointer"
        @click="selected === el ? selected = null : selected = el"/>
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