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
const { isCompact } = useUiDensity()

const emit = defineEmits<{
  join: [matchID: string]
}>()
</script>

<template>
  <article
    class="rounded-2xl border border-white/10 bg-slate-800/55 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.22)] backdrop-blur-sm transition hover:border-white/15 hover:bg-slate-800/70"
    :class="isCompact ? 'px-2.5 py-2.5 rounded-lg shadow-[0_10px_22px_rgba(2,6,23,0.2)]' : ''"
  >
    <div class="flex items-start justify-between gap-4" :class="isCompact ? 'gap-2.5' : ''">
      <div class="min-w-0 flex-1">
        <div class="flex items-stretch gap-3" :class="isCompact ? 'gap-2' : ''">
          <span
            v-if="room.is_private"
            class="inline-flex min-h-full w-7 shrink-0 items-center justify-center self-stretch text-amber-100"
            :class="isCompact ? 'w-5' : ''"
            aria-label="Private room"
            title="Private room"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-6 w-6"
              :class="isCompact ? 'h-4 w-4' : ''"
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
            <h3 class="truncate text-base font-semibold text-slate-50 sm:text-lg" :class="isCompact ? 'text-[0.88rem] leading-tight sm:text-[0.9rem]' : ''">
              {{ displayTitle }}
            </h3>
            <p v-if="room.creator_name" class="mt-1 font-mono text-xs text-slate-400" :class="isCompact ? 'mt-0.5 text-[0.6rem] leading-tight' : ''">
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
          :class="isCompact ? 'min-h-[1.65rem] rounded-md px-2 py-[0.2rem] text-[0.64rem] leading-none whitespace-nowrap' : ''"
          :disabled="isFull"
          @click="emit('join', room.matchID)"
        >
          Join
        </button>
        <NuxtLink
          v-else
          :to="`/room/${room.matchID}`"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
          :class="isCompact ? 'min-h-[1.65rem] rounded-md px-2 py-[0.2rem] text-[0.64rem] leading-none whitespace-nowrap' : ''"
        >
          Rejoin
        </NuxtLink>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-sm" :class="isCompact ? 'mt-2 gap-1.5 text-[0.68rem]' : ''">
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.13em] text-[0.56rem]' : ''">Players</p>
        <p class="mt-1 text-base font-semibold text-slate-100" :class="isCompact ? 'mt-0.5 text-[0.8rem] leading-tight' : ''">
          {{ joinedCount }} / {{ totalPlayers }}
        </p>
      </div>
      <div class="flex flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.13em] text-[0.56rem]' : ''">Stake</p>
        <p class="mt-1 inline-flex items-center justify-center gap-2 text-base font-semibold text-amber-200" :class="isCompact ? 'mt-0.5 gap-1 text-[0.8rem] leading-tight' : ''">
          {{ room.coin_stake ?? 10 }}
          <IconsCoinIcon class="h-4 w-4" :class="isCompact ? 'h-2.5 w-2.5' : ''" />
        </p>
      </div>
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.13em] text-[0.56rem]' : ''">Status</p>
        <div class="mt-2 flex w-full items-center justify-center" :class="isCompact ? 'mt-1' : ''">
          <span class="inline-flex h-4 w-4 rounded-full" :class="[statusDotClass, isCompact ? 'h-3 w-3' : '']" />
        </div>
      </div>
    </div>
  </article>
</template>
