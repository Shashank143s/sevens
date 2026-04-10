<script setup lang="ts">
defineProps<{
  logoSrc: string
  neutral?: boolean
  hidden?: boolean
}>()
</script>

<template>
  <div
    class="launch-splash"
    :class="{
      'launch-splash--neutral': neutral,
      'launch-splash--hidden': hidden,
    }"
    aria-hidden="true"
  >
    <template v-if="!neutral">
      <div class="launch-splash__glow launch-splash__glow--left" />
      <div class="launch-splash__glow launch-splash__glow--right" />
      <div class="launch-splash__card">
        <div class="launch-splash__logo-wrap">
          <img
            :src="logoSrc"
            alt="Sevens Royale"
            class="launch-splash__logo"
          >
        </div>
        <p class="launch-splash__eyebrow">The Classic Game, Elevated</p>
        <h1 class="launch-splash__title" aria-label="Sevens">
          <span class="launch-splash__title-char">S</span>
          <span class="launch-splash__title-char">E</span>
          <span class="launch-splash__title-char">V</span>
          <span class="launch-splash__title-char launch-splash__title-char--mirror">E</span>
          <span class="launch-splash__title-char launch-splash__title-char--mirror">N</span>
          <span class="launch-splash__title-char launch-splash__title-char--mirror">S</span>
        </h1>
        <p class="launch-splash__subtitle">Let's play!</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.launch-splash {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(209, 167, 40, 0.16), transparent 34%),
    linear-gradient(180deg, #04140d 0%, #041a13 42%, #020617 100%);
}

.launch-splash--hidden {
  opacity: 0;
  pointer-events: none;
}

.launch-splash--neutral {
  background: #020617;
}

@media (min-width: 641px) {
  .launch-splash {
    display: none;
  }
}

.launch-splash__glow {
  position: absolute;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  filter: blur(22px);
  opacity: 0.6;
}

.launch-splash__glow--left {
  left: -4rem;
  bottom: 12%;
  background: rgba(20, 184, 166, 0.14);
}

.launch-splash__glow--right {
  right: -5rem;
  top: 10%;
  background: rgba(209, 167, 40, 0.18);
}

.launch-splash__card {
  position: relative;
  z-index: 1;
  width: min(24rem, calc(100vw - 3rem));
  padding: 2rem 1.75rem;
  border: 1px solid rgba(248, 250, 252, 0.08);
  border-radius: 2rem;
  text-align: center;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.4);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.4);
  backdrop-filter: blur(18px);
}

.launch-splash__logo-wrap {
  width: 5.75rem;
  height: 5.75rem;
  margin: 0 auto 1.25rem;
  padding: 0.7rem;
  border-radius: 1.6rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(15, 23, 42, 0.55));
  box-shadow: 0 18px 45px rgba(2, 6, 23, 0.38);
}

.launch-splash__logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.launch-splash__eyebrow {
  margin: 0 0 0.65rem;
  color: #d4af37;
  font-size: 0.76rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.launch-splash__title {
  margin: 0;
  font-family: 'Arial Black', Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  font-size: clamp(2.2rem, 10vw, 3.4rem);
  line-height: 0.95;
  letter-spacing: 0.04em;
  color: #f8f4ec;
  display: inline-flex;
  align-items: baseline;
  gap: 0.01em;
}

.launch-splash__title-char {
  display: inline-block;
}

.launch-splash__title-char--mirror {
  transform: scaleX(-1);
}

.launch-splash__subtitle {
  margin: 1rem 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.98rem;
}
</style>
