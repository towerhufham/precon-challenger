<template>
  <template class="flex">
    <template v-for="([el, amount], index) in Object.entries(props.energyPool)" :key="index">
      <template v-if="el === 'Holy'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.25a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0V3a.75.75 0 0 1 .75-.75m0 16.004a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0v-2a.75.75 0 0 1 .75-.75M2.25 12a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75m16 0a.75.75 0 0 1 .75-.75h2a.75.75 0 1 1 0 1.5h-2a.75.75 0 0 1-.75-.75m1.28-7.53a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m-15.06 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06m3.06 12a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m8.94 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06M12 7.25a4.75 4.75 0 1 0 0 9.5a4.75 4.75 0 0 0 0-9.5"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Fire'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16"><path fill="currentColor" d="M8 16c3.314 0 6-2 6-5.5c0-1.5-.5-4-2.5-6c.25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6c-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75c0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5c-.179 1-.25 2 1 3c.625.5 1 1.364 1 2.25C11 14 9.657 15 8 15"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Stone'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m9.367 19.08l-7.025-9.04h3.836zm5.987-9.04l-3.36 10.946L8.12 10.039zm6.28 0l-7.209 9.272l2.859-9.273zM22 8.206h-4.704l-1.43-5.192h2.652a.4.4 0 0 1 .257.183zm-6.597 0h-7.27l1.833-5.18h3.995zM8.011 3.039l-1.82 5.167H2L5.128 3.32l.097-.11a.5.5 0 0 1 .16-.123a.4.4 0 0 1 .17 0z"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Thunder'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><path fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-width="4" d="M19 4h18L26 18h15L17 44l5-19H8z"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Plant'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Wind'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h8.5a2.5 2.5 0 1 0-2.34-3.24M3 12h15.5a2.5 2.5 0 1 1-2.34 3.24M4 16h5.5a2.5 2.5 0 1 1-2.34 3.24"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Water'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 20 20"><path fill="currentColor" d="M10.203.561c-.027-.215-.38-.215-.406 0c-.883 7.107-5.398 8.572-5.398 13.512c0 3.053 2.564 5.527 5.601 5.527s5.6-2.475 5.6-5.527c0-4.94-4.514-6.405-5.397-13.512M9.35 8.418q-.09.328-.189.678c-.401 1.424-.856 3.039-.856 4.906c0 1.012-.598 1.371-1.156 1.371a1.16 1.16 0 0 1-1.156-1.166c0-2.207 1.062-3.649 2-4.92c.295-.398.572-.775.797-1.15c.103-.172.38-.164.506.006c.059.08.079.182.054.275"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Dark'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Cyber'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2s.06-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.92 7.92 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8 8 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.7 15.7 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/></svg>
        </template>
      </template>
      <template v-else-if="el === 'Space'">
        <template v-for="_ in amount">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512"><path fill="currentColor" d="M431.76 256c-69 42.24-137.27 126.89-175.76 224.78C217.51 382.89 149.25 298.24 80.24 256c69-42.24 137.27-126.89 175.76-224.78C294.49 129.11 362.75 213.76 431.76 256"/></svg>
        </template>
      </template>
    </template>
  </template>
</template>

<script setup lang="ts">
  import type { EnergyPool } from '../game';
  const props = defineProps<{
    energyPool: Partial<EnergyPool>
  }>()
</script>