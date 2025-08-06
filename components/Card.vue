<template>
  <article class="w-32 h-48 flex flex-col justify-between items-center rounded-sm bg-slate-800 hover:translate-y-[-10px] transition duration-150 cursor-pointer" 
  :style="borderStyles">
    <p class="font-bold pb-2 mt-1 text-center" :style="textStyles">{{ card.name }}</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAD6ElEQVR4Xu2YTW7iQBCFmyvwkyOQRY4AElcgXIFlWMMZYA3XAK6AlByBBVwBwhXIlDVt2Z123ON60VSUF2mkIS4/l7+vq23Scs7d//zjjxECLQoxYuJvGxRiy4ejEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg7nBAKMUbAWDucEAoxRsBYO5wQCjFGwFg70AnZbrfu6enJPT4+frrN19dXNxgM8t+3WnLp8k9KDZLf6XRyx+PRTSaTUux4PHa73S7/nfy/SU2TXmFC1uu1e3l5cefz+ZMQEfX8/Oy8hPCzNJ5S0+QGq87x8mOw7/d7JsRLCD9LZkpNk34hQoorOyZEmt9sNm42m+U9vr+/u8PhULrpupomNxg7R67dbrezQ6EQWRij0ch1Op38VL/YiguqrqZpr2ohfmUvFgs3nU6zPopb1nw+d8vlMpuQ/X6f9ykSe71eVptSU7W9yXVXq1V22IOLrXp/vmxT/X4/m9bYypfjl8vFDYfD/JJ+C/PXSqn5b0KKF5ZGQyHh6vL1xZWYUhO7Qblet9vNV7MAfnt7K8H8CkxMSDi5/vzilKfUmBUSe15Is0UhKTWxG/QrVybi4eEhe2mIvSxUwUl5NsSExM6TutjW/K9i1FtW3YSkwE6pqboxP11yPHwG1cH4lUJStqOUmrqt53a7lR7EdTL8ig6fNynbUUpNyvVjNd8+ISkP7JSaqhssvuF99TCPnf8rH+pVeyvitdeLlK1KfuR7UPGtq26VxoT8+NfeumeIHPer2D9ww8+pNSFgkXq9XvPX7PCtq4mQ4ouCfDEMP0tmSk3dtauOf/uW5S+c8meRlBqf579PFL/feFCxL6epW1YRuD/nR/7ppOmK4HllAtAJIVw9AQrRM4QmUAgUpz6MQvQMoQkUAsWpD6MQPUNoAoVAcerDKETPEJpAIVCc+jAK0TOEJlAIFKc+jEL0DKEJFALFqQ+jED1DaAKFQHHqwyhEzxCaQCFQnPowCtEzhCZQCBSnPoxC9AyhCRQCxakPoxA9Q2gChUBx6sMoRM8QmkAhUJz6MArRM4QmUAgUpz6MQvQMoQkUAsWpD6MQPUNoAoVAcerDKETPEJpAIVCc+jAK0TOEJlAIFKc+jEL0DKEJFALFqQ+jED1DaAKFQHHqwyhEzxCaQCFQnPowCtEzhCZQCBSnPoxC9AyhCR/SY78fqqndRQAAAABJRU5ErkJggg=="/>
    <p>&nbsp;</p>
    <!-- <p> {{ card.power }} / {{ card.maxPower === "Unlimited" ? "∞" : card.maxPower }}</p> -->
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance } from '~/game';
  // import { getElementalBorder, getElementalText } from '~/elementalStyles';
  const props = defineProps<{card: CardInstance}>()

  const borderStyles = computed(() => (
    {"border": `4px solid ${props.card.color}`}
  ))
  const textStyles = computed(() => (
    {"color": props.card.color}
  ))
</script>