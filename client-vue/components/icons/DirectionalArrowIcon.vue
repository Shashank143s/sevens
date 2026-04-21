<script setup lang="ts">
const props = withDefaults(defineProps<{
  direction?: 'left' | 'right'
}>(), {
  direction: 'right',
})
</script>

<template>
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="props.direction === 'left'">
      <path d="M12.5 4.5 7 10l5.5 5.5" />
      <path d="M6 10h14" />
    </template>
    <template v-else>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
      <path d="M14 10H0" />
    </template>
  </svg>
</template>
