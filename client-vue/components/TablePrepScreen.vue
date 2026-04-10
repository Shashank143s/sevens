<script setup lang="ts">
type LoadingCard = {
  src: string
  alt: string
}

defineProps<{
  backgroundImage: string
  loadingCards: LoadingCard[]
}>()
</script>

<template>
  <div
    class="room-table-stage__overlay min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat p-4 text-white safe-area-padding sm:p-6"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <div class="room-table-stage__scrim" />
    <div class="room-table-stage__dialog text-center">
      <div class="room-table-stage__spinner" aria-hidden="true">
        <span class="room-table-stage__spinner-ring room-table-stage__spinner-ring--outer" />
        <span class="room-table-stage__spinner-ring room-table-stage__spinner-ring--inner" />
        <div class="room-table-stage__card-stack">
          <img
            v-for="(card, index) in loadingCards"
            :key="card.alt"
            :src="card.src"
            :alt="card.alt"
            class="room-table-stage__card"
            :style="{ animationDelay: `${index * 0.8}s` }"
          >
        </div>
      </div>
      <p class="room-table-stage__label">Shuffling cards</p>
    </div>
  </div>
</template>

<style scoped>
.room-table-stage__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 50;
}

.room-table-stage__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(15, 23, 42, 0.18), rgba(2, 6, 23, 0.84) 72%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 0.82));
  backdrop-filter: blur(4px);
}

.room-table-stage__dialog {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
}

.room-table-stage__label {
  margin: 0;
  color: #d4af37;
  font-size: clamp(1.2rem, 4.8vw, 2rem);
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-align: center;
}

.room-table-stage__spinner {
  position: relative;
  width: 12rem;
  height: 12rem;
  margin: 0 auto;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.12), transparent 34%),
    radial-gradient(circle at 70% 70%, rgba(5, 150, 105, 0.1), transparent 40%),
    radial-gradient(circle, rgba(20, 83, 45, 0.92) 0%, rgba(6, 78, 59, 0.94) 54%, rgba(2, 24, 19, 0.98) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(187, 247, 208, 0.08),
    inset 0 18px 34px rgba(74, 222, 128, 0.05),
    0 24px 60px rgba(2, 24, 19, 0.48);
}

.room-table-stage__spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border-style: solid;
  animation: table-prep-spin 1.25s linear infinite;
}

.room-table-stage__spinner-ring--outer {
  border-width: 4px;
  border-color: rgba(134, 239, 172, 0.14);
  border-top-color: rgba(250, 204, 21, 0.92);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.16);
  animation-duration: 2.2s;
}

.room-table-stage__spinner-ring--inner {
  inset: 1rem;
  border-width: 3px;
  border-color: rgba(167, 243, 208, 0.14);
  border-bottom-color: rgba(220, 252, 231, 0.92);
  animation-direction: reverse;
  animation-duration: 1.8s;
}

.room-table-stage__card-stack {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.room-table-stage__card {
  position: absolute;
  width: 3.25rem;
  filter: drop-shadow(0 14px 22px rgba(15, 23, 42, 0.45));
  opacity: 0;
  transform: translateY(16px) scale(0.9) rotate(-14deg);
  transform-origin: 50% 82%;
  animation: table-prep-card-cycle 3.2s ease-in-out infinite;
}

@keyframes table-prep-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes table-prep-card-cycle {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.9) rotate(-16deg);
  }

  10% {
    opacity: 1;
    transform: translateY(4px) scale(0.98) rotate(-6deg);
  }

  24% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
  }

  42% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96) rotate(14deg);
  }

  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96) rotate(14deg);
  }
}
</style>
