<script setup lang="ts">
const props = defineProps<{
  roomName?: string
  joinedCount: number
  totalPlayers: number
  roomStatusMessage?: string | null
  roomBannerTone?: string
  isOnline?: boolean
  checkingRoom?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/95 text-white shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
    <div class="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(250,204,21,0.12),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-5 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-sky-300/80">Room Ready</p>
          <h2 class="mt-1 text-xl font-bold text-white">
            Waiting for players
          </h2>
          <p v-if="roomName" class="mt-2 truncate font-mono text-xs text-slate-400">
            {{ roomName }}
          </p>
        </div>
        <div class="w-[6.5rem] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">Joined</p>
          <p class="mt-1 text-lg font-bold text-white tabular-nums">
            {{ joinedCount }} / {{ totalPlayers }}
          </p>
        </div>
      </div>
    </div>

    <div class="p-5">
      <p
        v-if="roomStatusMessage"
        class="mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm"
        :class="roomBannerTone"
      >
        {{ roomStatusMessage }}
      </p>

      <div class="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/15 bg-emerald-400/10 shadow-[0_0_32px_rgba(16,185,129,0.22)]">
          <svg
            viewBox="0 0 24 24"
            class="h-7 w-7 text-emerald-200"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M16 16v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
            <circle cx="10" cy="7" r="3" />
            <path d="M22 16v-1a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p class="text-sm leading-6 text-slate-300">
          The table will launch automatically as soon as every seat is filled. Sit tight while the rest of the players lock in.
        </p>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <button
          v-if="isOnline"
          type="button"
          class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="checkingRoom"
          @click="emit('retry')"
        >
          {{ checkingRoom ? 'Checking...' : 'Check Again' }}
        </button>
        <div v-else class="rounded-2xl border border-red-400/20 bg-red-950/35 px-4 py-3 text-center text-sm font-semibold text-red-100">
          Offline
        </div>
        <NuxtLink
          to="/lobby"
          class="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-600"
        >
          Back to Lobby
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
