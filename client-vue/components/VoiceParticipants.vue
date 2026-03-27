<script setup lang="ts">
import type { VoiceParticipant } from '~/composables/useVoiceChat'

defineProps<{
  participants: VoiceParticipant[]
  currentUserId?: string
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="participant in participants"
      :key="participant.userId"
      class="inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
      :class="participant.speaking
        ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.18)]'
        : 'border-white/10 bg-slate-950/70 text-slate-200'"
    >
      <span
        class="inline-flex h-2.5 w-2.5 rounded-full"
        :class="participant.speaking ? 'bg-emerald-300' : participant.connected ? 'bg-sky-300/70' : 'bg-slate-500'"
      />
      <span class="truncate max-w-[7.5rem]">
        {{ participant.userId === currentUserId ? 'You' : participant.displayName }}
      </span>
      <span v-if="participant.muted" class="text-[10px] uppercase tracking-[0.16em] text-rose-200/80">
        Muted
      </span>
    </div>
  </div>
</template>
