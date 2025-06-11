<template>
  <div>
    <p>Select element:</p>
    <div class="flex gap-4 items-center">
      <ElementalIcon 
        v-for="el of ALL_ELEMENTS" :key="el"
        :elemental="el" size="3em" 
        :class="{
          'grayscale': !shownElements.includes(el), 
          'border-4 border-white box-border': model === el,
        }"
        class="cursor-pointer"
        @click="model === el ? model = null : model = el"/>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ALL_ELEMENTS } from '~/game';
  import type { Elemental, ElementalSelectionCriteria } from '~/game';
  const props = defineProps<{criteria: ElementalSelectionCriteria}>()
  const shownElements = computed(() => {
    //error, see top comment
    if (props.criteria.type !== "Element") return []
    return props.criteria.allowedElements === "All"
      ? ALL_ELEMENTS
      : props.criteria.allowedElements
  })
  const model = defineModel<Elemental|null>()
</script>