<script setup lang="ts">
const props = defineProps<{
  matchId: string
  roomName?: string
  playerName: string
  avatar: string
  roomPassword?: string
  requiresPassword?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:playerName': [value: string]
  'update:avatar': [value: string]
  'update:roomPassword': [value: string]
  submit: []
}>()
</script>

<template>
  <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600 text-white">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-white">
        Join {{ roomName || `Room ${matchId}` }}
      </h2>
      <NuxtLink
        to="/lobby"
        class="text-slate-400 hover:text-white p-1 text-2xl leading-none"
        aria-label="Back to Lobby"
      >
        ×
      </NuxtLink>
    </div>
    <input
      :value="playerName"
      type="text"
      placeholder="Your alias"
      class="w-full bg-slate-700 border border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
      @input="emit('update:playerName', ($event.target as HTMLInputElement).value)"
      @keydown.enter="!disabled && emit('submit')"
    >
    <input
      v-if="requiresPassword"
      :value="roomPassword"
      type="password"
      placeholder="Room password"
      class="w-full bg-slate-700 border border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
      @input="emit('update:roomPassword', ($event.target as HTMLInputElement).value)"
      @keydown.enter="!disabled && emit('submit')"
    >
    <div class="mb-2 text-sm text-slate-400">
      Avatar
    </div>
    <AvatarPicker
      :model-value="avatar"
      class="mb-4"
      @update:model-value="emit('update:avatar', $event)"
    />
    <div class="text-sm text-slate-400 mb-6">
      Selected avatar: <span class="text-2xl align-middle ml-2">{{ avatar }}</span>
    </div>
    <button
      type="button"
      class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="disabled"
      @click="emit('submit')"
    >
      {{ disabled ? 'Room Full' : 'Join the Table' }}
    </button>
    <NuxtLink to="/lobby" class="block mt-4 text-center text-slate-400 hover:text-white text-sm">
      ← Back to Lobby
    </NuxtLink>
  </div>
</template>
