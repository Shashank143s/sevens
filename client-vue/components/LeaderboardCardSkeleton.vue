<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <article
    class="leaderboard-skeleton animate-pulse"
    :class="{ 'leaderboard-skeleton--compact': compact }"
    aria-hidden="true"
  >
    <div class="leaderboard-skeleton__top">
      <div class="leaderboard-skeleton__main">
        <div class="leaderboard-skeleton__avatar" />
        <div class="leaderboard-skeleton__identity">
          <div class="leaderboard-skeleton__title" />
          <div class="leaderboard-skeleton__meta" />
        </div>
      </div>
      <div class="leaderboard-skeleton__rank-wrap">
        <div class="leaderboard-skeleton__rank" />
        <div class="leaderboard-skeleton__expand" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.leaderboard-skeleton {
  display: grid;
  gap: 0.72rem;
  padding: 0.85rem 0.9rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at right top, rgba(250, 204, 21, 0.08), transparent 22%),
    radial-gradient(circle at left bottom, rgba(59, 130, 246, 0.06), transparent 28%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.74));
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(14px);
}

.leaderboard-skeleton__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.leaderboard-skeleton__main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.leaderboard-skeleton__avatar,
.leaderboard-skeleton__title,
.leaderboard-skeleton__meta,
.leaderboard-skeleton__rank,
.leaderboard-skeleton__expand {
  background: rgba(255, 255, 255, 0.1);
}

.leaderboard-skeleton__rank-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.leaderboard-skeleton__avatar {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.95rem;
  flex-shrink: 0;
}

.leaderboard-skeleton__identity {
  min-width: 0;
  flex: 1;
}

.leaderboard-skeleton__title {
  width: 10.5rem;
  max-width: 100%;
  height: 1rem;
  border-radius: 999px;
}

.leaderboard-skeleton__meta {
  width: 8rem;
  max-width: 80%;
  height: 0.78rem;
  margin-top: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.leaderboard-skeleton__rank {
  min-width: 4.25rem;
  min-height: 4.25rem;
  border-radius: 1.1rem;
  flex-shrink: 0;
}

.leaderboard-skeleton__expand {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.leaderboard-skeleton--compact {
  gap: 0.5rem;
  padding: 0.62rem 0.68rem;
  border-radius: 0.9rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__top {
  gap: 0.58rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__main {
  gap: 0.52rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__avatar {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.66rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__title {
  height: 0.84rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__meta {
  height: 0.66rem;
  margin-top: 0.34rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__rank-wrap {
  gap: 0.24rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__rank {
  min-width: 2.85rem;
  min-height: 2.85rem;
  border-radius: 0.72rem;
}

.leaderboard-skeleton--compact .leaderboard-skeleton__expand {
  width: 1.68rem;
  height: 1.68rem;
  border-radius: 0.58rem;
}

@media (max-width: 640px) {
  .leaderboard-skeleton__rank {
    min-width: 3.4rem;
    min-height: 3.4rem;
  }
}
</style>
