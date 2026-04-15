<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  coinsBalanceLabel: string | null
  botOptions: number[]
  creating: boolean
  createNumPlayers: number
  createAiBots: number
  createStake: number
  createPrivateRoom: boolean
  createRoomPassword: string
  createRoomName: string
  roomNameError: string
  stakeError: string
  showBotsInfo: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: []
  roomNameBlur: []
  normalizeStakeInput: []
  markStakeTouched: []
  decrementStake: []
  incrementStake: []
  'update:createNumPlayers': [value: number]
  'update:createAiBots': [value: number]
  'update:createStake': [value: number]
  'update:createPrivateRoom': [value: boolean]
  'update:createRoomPassword': [value: string]
  'update:createRoomName': [value: string]
  'update:showBotsInfo': [value: boolean]
}>()

const createRoomNameInput = ref<HTMLInputElement | null>(null)

const createRoomNameValue = computed({
  get: () => props.createRoomName,
  set: (value: string) => emit('update:createRoomName', value),
})

const createNumPlayersValue = computed({
  get: () => props.createNumPlayers,
  set: (value: number) => emit('update:createNumPlayers', value),
})

const createAiBotsValue = computed({
  get: () => props.createAiBots,
  set: (value: number) => emit('update:createAiBots', value),
})

const createStakeValue = computed({
  get: () => props.createStake,
  set: (value: number) => emit('update:createStake', value),
})

const createPrivateRoomValue = computed({
  get: () => props.createPrivateRoom,
  set: (value: boolean) => emit('update:createPrivateRoom', value),
})

const createRoomPasswordValue = computed({
  get: () => props.createRoomPassword,
  set: (value: string) => emit('update:createRoomPassword', value),
})

watch(() => props.visible, async (open) => {
  if (!open) return
  await nextTick()
  createRoomNameInput.value?.focus()
  createRoomNameInput.value?.select()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/95 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div class="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_32%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-5 py-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-300/80">New Table</p>
              <h2 class="mt-1 text-xl font-bold text-white">Create a Room</h2>
            </div>
            <div class="flex items-center gap-2">
              <div class="inline-flex items-center rounded-full border border-amber-300/15 bg-white/5 px-3 py-1 text-sm font-semibold text-amber-100">
                <IconsCoinIcon class="mr-2 h-4 w-4" />
                {{ coinsBalanceLabel ?? '—' }}
              </div>
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-white/8 hover:text-white"
                aria-label="Close"
                @click="emit('close')"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div class="p-5">
          <label class="block text-sm font-semibold text-slate-300 mb-1.5">Room Name</label>
          <input
            ref="createRoomNameInput"
            v-model="createRoomNameValue"
            type="text"
            maxlength="40"
            placeholder="Friday Night Table"
            class="mb-1.5 w-full rounded-2xl bg-slate-800/80 px-4 py-3 text-white focus:outline-none focus:ring-2"
            :class="roomNameError
              ? 'border border-red-400/70 focus:ring-red-400'
              : 'border border-slate-600 focus:ring-amber-500'"
            @blur="emit('roomNameBlur')"
          >
          <p v-if="roomNameError" class="mb-4 text-xs font-semibold text-red-300">{{ roomNameError }}</p>
          <div v-else class="mb-4" />

          <div class="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label class="create-room-modal__field-label">Room Size</label>
              <div class="relative">
                <select
                  v-model.number="createNumPlayersValue"
                  class="w-full appearance-none rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option :value="2">2 Players</option>
                  <option :value="3">3 Players</option>
                  <option :value="4">4 Players</option>
                </select>
                <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300">
                  <svg
                    viewBox="0 0 20 20"
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 7.5 5 5 5-5" />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <div class="create-room-modal__field-label create-room-modal__field-label--with-icon">
                <span>Bots</span>
                <div class="relative">
                  <button
                    type="button"
                    class="create-room-modal__info-trigger"
                    aria-label="Explain bots and room size"
                    :aria-expanded="showBotsInfo ? 'true' : 'false'"
                    @click="emit('update:showBotsInfo', !showBotsInfo)"
                    @mouseenter="emit('update:showBotsInfo', true)"
                    @mouseleave="emit('update:showBotsInfo', false)"
                    @focus="emit('update:showBotsInfo', true)"
                    @blur="emit('update:showBotsInfo', false)"
                  >
                    i
                  </button>
                  <Transition name="create-room-modal__tooltip">
                    <div
                      v-if="showBotsInfo"
                      class="create-room-modal__tooltip"
                      role="tooltip"
                    >
                      Room size includes bots. Example: 4 seats + 2 bots = 2 human players.
                    </div>
                  </Transition>
                </div>
              </div>
              <div class="relative">
                <select
                  v-model.number="createAiBotsValue"
                  class="w-full appearance-none rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option
                    v-for="option in botOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ option === 0 ? 'None' : `${option}` }}
                  </option>
                </select>
                <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300">
                  <svg
                    viewBox="0 0 20 20"
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 7.5 5 5 5-5" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div class="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <label class="block text-sm font-semibold text-slate-200">Stake per Player</label>
                <p class="mt-1 text-xs text-slate-400">Minimum 10 coins. Must not exceed your balance.</p>
              </div>
              <div class="flex flex-col items-center">
                <div class="inline-flex items-center rounded-full border border-white/10 bg-slate-950/70 p-1">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-200 transition hover:bg-white/8"
                    aria-label="Decrease stake"
                    @click="emit('decrementStake')"
                  >
                    −
                  </button>
                  <input
                    v-model.number="createStakeValue"
                    type="number"
                    min="10"
                    step="10"
                    class="w-14 bg-transparent px-1 text-center text-base font-bold text-amber-100 focus:outline-none"
                    @blur="emit('normalizeStakeInput')"
                    @input="emit('markStakeTouched')"
                  >
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-200 transition hover:bg-white/8"
                    aria-label="Increase stake"
                    @click="emit('incrementStake')"
                  >
                    +
                  </button>
                </div>
                <p v-if="stakeError" class="mt-2 text-xs font-semibold text-red-300">{{ stakeError }}</p>
              </div>
            </div>
          </div>

          <div class="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-200">Private room</p>
              <p class="mt-1 text-xs text-slate-400">Only players with the password can join.</p>
            </div>
            <button
              type="button"
              class="relative inline-flex h-7 w-12 items-center rounded-full border transition"
              :class="createPrivateRoom ? 'border-amber-300/40 bg-amber-400/80' : 'border-white/10 bg-slate-800/80'"
              role="switch"
              :aria-checked="createPrivateRoom"
              aria-label="Toggle private room"
              @click="createPrivateRoomValue = !createPrivateRoom"
            >
              <span
                class="inline-flex h-5 w-5 transform rounded-full bg-white shadow transition"
                :class="createPrivateRoom ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div v-if="createPrivateRoom" class="mb-5 grid gap-3">
            <input
              v-model="createRoomPasswordValue"
              type="password"
              placeholder="Room password"
              class="w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
          </div>

          <button
            type="button"
            class="flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-bold text-slate-900 disabled:opacity-50 hover:bg-amber-600"
            :disabled="creating || !!roomNameError || !!stakeError"
            @click="emit('submit')"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.create-room-modal__field-label {
  display: block;
  margin-bottom: 0.375rem;
  color: rgb(203 213 225);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
}

.create-room-modal__field-label--with-icon {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.25rem;
}

.create-room-modal__info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.82rem;
  height: 0.82rem;
  padding: 0;
  margin-top: -0.05rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.28);
  background: rgba(250, 204, 21, 0.12);
  color: rgba(253, 230, 138, 0.95);
  font-size: 0.56rem;
  font-weight: 800;
  line-height: 1;
  vertical-align: middle;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
}

.create-room-modal__info-trigger:hover,
.create-room-modal__info-trigger:focus-visible {
  background: rgba(250, 204, 21, 0.2);
  border-color: rgba(250, 204, 21, 0.42);
  color: #fef3c7;
}

.create-room-modal__tooltip {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 10;
  width: min(13rem, calc(100vw - 4rem));
  padding: 0.8rem 0.9rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.94));
  box-shadow: 0 20px 42px rgba(2, 6, 23, 0.38);
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.8rem;
  line-height: 1.4;
}

.create-room-modal__tooltip-enter-active,
.create-room-modal__tooltip-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.create-room-modal__tooltip-enter-from,
.create-room-modal__tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
