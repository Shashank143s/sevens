<script setup lang="ts">
const router = useRouter()

const props = defineProps<{
  matchId: string
  compact?: boolean
  roomName?: string
  roomStake?: number
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
  <div
    class="join-table-modal w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/95 text-white shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    :class="compact ? 'join-table-modal--compact max-w-xl rounded-[1.35rem]' : ''"
  >
    <div
      class="join-table-modal__header border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(250,204,21,0.12),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-5 py-4"
      :class="compact ? 'px-4 py-3' : ''"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-sky-300/80">Join Table</p>
          <h2 class="mt-1 truncate text-xl font-bold text-white">
            {{ roomName || `Room ${matchId}` }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <div
            v-if="roomStake != null"
            class="inline-flex items-center rounded-full border border-amber-300/15 bg-white/5 px-3 py-1 text-sm font-semibold text-amber-100"
          >
            <IconsCoinIcon class="mr-2 h-4 w-4" />
            {{ roomStake }}
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-white/8 hover:text-white"
            aria-label="Back to Lobby"
            @click="router.push('/lobby')"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <div class="join-table-modal__body p-5" :class="compact ? 'p-4' : ''">
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-semibold text-slate-300">Alias</label>
        <input
          :value="playerName"
          type="text"
          placeholder="Your alias"
          class="join-table-modal__input w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @input="emit('update:playerName', ($event.target as HTMLInputElement).value)"
          @keydown.enter="!disabled && emit('submit')"
        >
      </div>

      <div v-if="requiresPassword" class="mb-4">
        <label class="mb-1.5 block text-sm font-semibold text-slate-300">Password</label>
        <input
          :value="roomPassword"
          type="password"
          placeholder="Room password"
          class="join-table-modal__input w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @input="emit('update:roomPassword', ($event.target as HTMLInputElement).value)"
          @keydown.enter="!disabled && emit('submit')"
        >
      </div>

      <div class="join-table-modal__avatar mb-5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-200">
            Avatar
          </div>
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Selected <span class="ml-1 text-base normal-case text-white">{{ avatar }}</span>
          </div>
        </div>
        <AvatarPicker
          :model-value="avatar"
          @update:model-value="emit('update:avatar', $event)"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="join-table-modal__secondary-btn inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
          @click="router.push('/lobby')"
        >
          Back to Lobby
        </button>
        <button
          type="button"
          class="join-table-modal__submit inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 font-bold text-slate-900 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click="emit('submit')"
        >
          {{ disabled ? 'Room Full' : 'Join' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-table-modal--compact {
  font-size: 0.89rem;
}

.join-table-modal--compact .join-table-modal__header {
  padding: 0.7rem 0.95rem !important;
}

.join-table-modal--compact .join-table-modal__header p {
  font-size: 0.62rem;
  letter-spacing: 0.18em;
}

.join-table-modal--compact .join-table-modal__header h2 {
  margin-top: 0.2rem;
  font-size: 1.08rem;
}

.join-table-modal--compact .join-table-modal__body {
  padding: 0.9rem !important;
}

.join-table-modal--compact .join-table-modal__body .mb-4 {
  margin-bottom: 0.72rem;
}

.join-table-modal--compact .join-table-modal__body .mb-5 {
  margin-bottom: 0.85rem;
}

.join-table-modal--compact .join-table-modal__input {
  border-radius: 0.72rem;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
  font-size: 0.85rem;
}

.join-table-modal--compact .join-table-modal__avatar {
  border-radius: 0.88rem;
  padding: 0.62rem 0.75rem;
}

.join-table-modal--compact .join-table-modal__secondary-btn,
.join-table-modal--compact .join-table-modal__submit {
  border-radius: 0.85rem;
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
  font-size: 0.93rem;
}
</style>
