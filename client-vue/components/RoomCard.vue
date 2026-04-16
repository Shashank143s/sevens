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
const config = useRuntimeConfig()
const isCompact = computed(() => config.public.uiDensity === 'compact')

const emit = defineEmits<{
  join: [matchID: string]
}>()
</script>

<template>
  <article
    class="rounded-2xl border border-white/10 bg-slate-800/55 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.22)] backdrop-blur-sm transition hover:border-white/15 hover:bg-slate-800/70"
    :class="isCompact ? 'px-3 py-3 rounded-xl shadow-[0_14px_28px_rgba(2,6,23,0.2)]' : ''"
  >
    <div class="flex items-start justify-between gap-4" :class="isCompact ? 'gap-3' : ''">
      <div class="min-w-0 flex-1">
        <div class="flex items-stretch gap-3" :class="isCompact ? 'gap-2.5' : ''">
          <span
            v-if="room.is_private"
            class="inline-flex min-h-full w-7 shrink-0 items-center justify-center self-stretch text-amber-100"
            :class="isCompact ? 'w-6' : ''"
            aria-label="Private room"
            title="Private room"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-6 w-6"
              :class="isCompact ? 'h-5 w-5' : ''"
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
            <h3 class="truncate text-base font-semibold text-slate-50 sm:text-lg" :class="isCompact ? 'text-[0.95rem] sm:text-base' : ''">
              {{ displayTitle }}
            </h3>
            <p v-if="room.creator_name" class="mt-1 font-mono text-xs text-slate-400" :class="isCompact ? 'mt-0.5 text-[0.68rem]' : ''">
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
          :class="isCompact ? 'min-h-8 px-3 py-1.5 text-xs' : ''"
          :disabled="isFull"
          @click="emit('join', room.matchID)"
        >
          Join
        </button>
        <NuxtLink
          v-else
          :to="`/room/${room.matchID}`"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
          :class="isCompact ? 'min-h-8 px-3 py-1.5 text-xs' : ''"
        >
          Rejoin
        </NuxtLink>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-sm" :class="isCompact ? 'mt-2.5 gap-2 text-xs' : ''">
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.15em] text-[0.62rem]' : ''">Players</p>
        <p class="mt-1 text-base font-semibold text-slate-100" :class="isCompact ? 'mt-0.5 text-sm' : ''">
          {{ joinedCount }} / {{ totalPlayers }}
        </p>
      </div>
      <div class="flex flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.15em] text-[0.62rem]' : ''">Stake</p>
        <p class="mt-1 inline-flex items-center justify-center gap-2 text-base font-semibold text-amber-200" :class="isCompact ? 'mt-0.5 gap-1 text-sm' : ''">
          {{ room.coin_stake ?? 10 }}
          <IconsCoinIcon class="h-4 w-4" :class="isCompact ? 'h-3 w-3' : ''" />
        </p>
      </div>
      <div class="flex min-w-0 flex-col items-center text-center">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400" :class="isCompact ? 'tracking-[0.15em] text-[0.62rem]' : ''">Status</p>
        <div class="mt-2 flex w-full items-center justify-center" :class="isCompact ? 'mt-1.5' : ''">
          <span class="inline-flex h-4 w-4 rounded-full" :class="[statusDotClass, isCompact ? 'h-3.5 w-3.5' : '']" />
        </div>
      </div>
    </div>
  </article>
</template>
