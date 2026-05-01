<script setup lang="ts">
const avatars = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵']

defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const select = (avatar: string) => {
  emit('update:modelValue', avatar)
}
</script>

<template>
  <div class="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4">
    <button
      v-for="a in avatars"
      :key="a"
      type="button"
      class="text-3xl sm:text-4xl md:text-5xl hover:scale-125 active:scale-95 transition p-2 rounded-xl sm:rounded-2xl active:bg-slate-100 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="select(a)"
    >
      {{ a }}
    </button>
  </div>
</template>
