<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  mandatory: boolean
  inProgress?: boolean
  downloaded?: boolean
  message?: string
  currentVersionCode?: number
  targetVersionCode?: number
  errorMessage?: string | null
}>(), {
  inProgress: false,
  downloaded: false,
  message: '',
  currentVersionCode: 0,
  targetVersionCode: 0,
  errorMessage: null,
})

const emit = defineEmits<{
  update: []
  later: []
}>()

const title = computed(() => props.mandatory ? 'Update Required' : 'Update Available')
const primaryLabel = computed(() => props.downloaded ? 'Restart to Update' : 'Update Now')
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4"
      @click.self="mandatory ? undefined : emit('later')"
    >
      <div class="w-full max-w-md overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-900/95 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div class="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_35%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-5 py-4">
          <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-300/80">Sevens Royale</p>
          <h2 class="mt-1 text-2xl font-bold text-white">{{ title }}</h2>
        </div>

        <div class="space-y-4 p-5 text-slate-200">
          <p class="text-sm leading-6 text-slate-300">{{ message }}</p>

          <div class="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-400">Current Version</span>
              <span class="font-semibold text-white">vCode {{ currentVersionCode }}</span>
            </div>
            <div class="mt-2 flex items-center justify-between gap-3">
              <span class="text-slate-400">Target Version</span>
              <span class="font-semibold text-amber-200">vCode {{ targetVersionCode }}</span>
            </div>
          </div>

          <p
            v-if="errorMessage"
            class="rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-100"
          >
            {{ errorMessage }}
          </p>

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-base font-bold text-slate-900 transition hover:bg-amber-600 disabled:opacity-60"
              :disabled="inProgress"
              @click="emit('update')"
            >
              {{ inProgress ? 'Please wait...' : primaryLabel }}
            </button>
            <button
              v-if="!mandatory"
              type="button"
              class="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/10"
              :disabled="inProgress"
              @click="emit('later')"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
