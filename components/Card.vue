<template>
  <article class="w-32 h-48 flex flex-col justify-between items-center border-2 border-black rounded-sm" :style="getElementalBackground(card.elements)">
    <p class="font-bold pb-2">{{ card.name }}</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAADSklEQVR4Xu2XsYoqQRBFe0ERA0UUMRETAxMDwf//AwUDEwNBxEQEERTEQPZRAzP0a3ZW2Lt3qOe7Rrtq1dScM7e7/VgsFp9BLzcEPiTEjYtsEAnx5UNCnPmQEAnxRsDZPNpDJMQZAWfjKCES4oyAs3GUEAlxRsDZOEqIhDgj4GwcJURCnBFwNo4SIiHOCDgbRwmREGcEnI2jhEiIMwLOxlFCJMQZAWfjKCES4oyAs3GUEAlxRsDZOEqIhDgj4GwcJURCnBFwNo4SIiHOCDgbRwmREGcEnI2jhEiIMwLOxlFCJMQZAWfjKCES4oyAs3GUEAlxRsDZOJUmZDqdhvv9HrbbbYHB3ms0Gtn/9v7lcik+m8/n2d/P5zOsVisY3WAwCMPhMCyXy796lV0n/759+Xa7hc1mA8/wqkFlQnLwBjwXMh6PQ7PZDOv1OoxGo9DtdgvwsbzJZJLdBwIkhhsL+e46JupwOITj8Rhms1k4n89hv9+/Ygp9XokQuzET0Wq1wvV6LYSkN5kDeDwewWTliSl7stPEfZVAo2O9Op1OOJ1Ood/vFwmx98qukz4g8cMDEX9RXImQfAYTEAuJn0D7Ti7IhMRLSwouvier2e12od1uZ2n7LkUGORaSio6v0+v1ivTa9VJBLCn/vBCDaPJsH0r3hhSahCREGAmxS5QtVRLyIsepEHQPyZcSW6rq9Xq2AcentFdCtIcke8hvnLJsH7KlKl+67MRW9kqXrDRd6WnubU9ZZZt6DuSnv0PShJngWq1WurF/JcRm+C9/h7BOJe/Wt9JT1rvBY9yPhDCoAj0lBIDHKJUQBlWgp4QA8BilEsKgCvSUEAAeo1RCGFSBnhICwGOUSgiDKtBTQgB4jFIJYVAFekoIAI9RKiEMqkBPCQHgMUolhEEV6CkhADxGqYQwqAI9JQSAxyiVEAZVoKeEAPAYpRLCoAr0lBAAHqNUQhhUgZ4SAsBjlEoIgyrQU0IAeIxSCWFQBXpKCACPUSohDKpATwkB4DFKJYRBFegpIQA8RqmEMKgCPSUEgMcolRAGVaCnhADwGKUSwqAK9JQQAB6jVEIYVIGeEgLAY5RKCIMq0FNCAHiMUglhUAV6SggAj1EqIQyqQM8/f1X9Lw1CsGoAAAAASUVORK5CYII="/>
    <p> {{ card.power }} / {{ card.maxPower === "Unlimited" ? "∞" : card.maxPower }}</p>
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance } from '~/game';
  import { getElementalBackground } from '~/elementalStyles';
  const props = defineProps<{card: CardInstance}>()
</script>