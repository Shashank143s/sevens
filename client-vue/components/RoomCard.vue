<script setup lang="ts">
import type { LobbyMatch } from '~/composables/useLobbyApi'

const props = defineProps<{
  room: LobbyMatch
  joinedCount: number
  totalPlayers: number
  hasJoined: boolean
  isFull: boolean
  statusDotClass: string
  displayTitle: string
}>()

const emit = defineEmits<{
  join: [matchID: string]
}>()
</script>

<template>
  <article class="rounded-2xl border border-white/10 bg-slate-800/55 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.22)] backdrop-blur-sm transition hover:border-white/15 hover:bg-slate-800/70">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-stretch gap-3">
          <span
            v-if="room.is_private"
            class="inline-flex min-h-full w-7 shrink-0 items-center justify-center self-stretch text-amber-100"
            aria-label="Private room"
            title="Private room"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
          </span>
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-slate-50 sm:text-lg">
              {{ displayTitle }}
            </h3>
            <p v-if="room.creator_name" class="mt-1 font-mono text-xs text-slate-400">
              {{ room.creator_name }}
            </p>
          </div>
        </div>
      </div>

      <div class="shrink-0">
        <button
          v-if="!hasJoined"
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
          :disabled="isFull"
          @click="emit('join', room.matchID)"
        >
          Join
        </button>
        <NuxtLink
          v-else
          :to="`/room/${room.matchID}`"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
        >
          Rejoin
        </NuxtLink>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Players</p>
        <p class="mt-1 text-base font-semibold text-slate-100">
          {{ joinedCount }} / {{ totalPlayers }}
        </p>
      </div>
      <div class="flex flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Stake</p>
        <p class="mt-1 inline-flex items-center justify-center gap-2 text-base font-semibold text-amber-200">
          {{ room.coin_stake ?? 10 }}
          <IconsCoinIcon class="h-4 w-4" />
        </p>
      </div>
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
        <div class="mt-2 flex w-full items-center justify-center">
          <span class="inline-flex h-4 w-4 rounded-full" :class="statusDotClass" />
        </div>
      </div>
    </div>
  </article>
</template>
