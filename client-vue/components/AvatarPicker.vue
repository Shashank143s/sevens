<script setup lang="ts">
const avatars = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵']

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const select = (avatar: string) => {
  emit('update:modelValue', avatar)
}
</script>

<template>
  <div class="grid grid-cols-5 gap-4">
    <button
      v-for="a in avatars"
      :key="a"
      type="button"
      class="text-5xl hover:scale-125 transition p-2 rounded-2xl active:bg-slate-100"
      @click="select(a)"
    >
      {{ a }}
    </button>
  </div>
</template>
