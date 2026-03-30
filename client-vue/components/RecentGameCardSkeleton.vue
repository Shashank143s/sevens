<template>
  <article class="recent-game-skeleton animate-pulse" aria-hidden="true">
    <div class="recent-game-skeleton__top">
      <div class="recent-game-skeleton__copy">
        <div class="recent-game-skeleton__title" />
        <div class="recent-game-skeleton__meta" />
      </div>
      <div class="recent-game-skeleton__badge" />
    </div>

    <div class="recent-game-skeleton__bottom">
      <div class="recent-game-skeleton__chip recent-game-skeleton__chip--coins" />
      <div class="recent-game-skeleton__chip recent-game-skeleton__chip--xp" />
    </div>
  </article>
</template>

<style scoped>
.recent-game-skeleton {
  position: relative;
  overflow: hidden;
  border-radius: 1.55rem;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
    linear-gradient(160deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.7));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 48px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(18px);
}

.recent-game-skeleton__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.recent-game-skeleton__copy {
  min-width: 0;
  flex: 1;
}

.recent-game-skeleton__title,
.recent-game-skeleton__meta,
.recent-game-skeleton__badge,
.recent-game-skeleton__chip {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.recent-game-skeleton__title {
  width: 11rem;
  max-width: 100%;
  height: 1.1rem;
}

.recent-game-skeleton__meta {
  width: 9rem;
  max-width: 90%;
  height: 0.85rem;
  margin-top: 0.55rem;
  background: rgba(255, 255, 255, 0.08);
}

.recent-game-skeleton__badge {
  width: 7.2rem;
  height: 2.2rem;
  flex-shrink: 0;
}

.recent-game-skeleton__bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.recent-game-skeleton__chip {
  min-height: 2rem;
}

.recent-game-skeleton__chip--coins {
  width: 6.5rem;
}

.recent-game-skeleton__chip--xp {
  width: 5.3rem;
  background: rgba(255, 255, 255, 0.08);
}
</style>
