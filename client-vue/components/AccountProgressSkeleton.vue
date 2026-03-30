<template>
  <section class="account-progress-skeleton animate-pulse" aria-hidden="true">
    <div class="account-progress-skeleton__top">
      <div class="account-progress-skeleton__chip account-progress-skeleton__chip--coins" />
      <div class="account-progress-skeleton__controls">
        <div class="account-progress-skeleton__chip account-progress-skeleton__chip--level" />
        <div class="account-progress-skeleton__chevron" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-progress-skeleton {
  margin-top: 1.1rem;
  padding: 0.85rem 1.05rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.1), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.2);
}

.account-progress-skeleton__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.account-progress-skeleton__controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.account-progress-skeleton__chip {
  min-height: 2.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.account-progress-skeleton__chip--coins {
  width:11rem;
  max-width: 100%;
}

.account-progress-skeleton__chip--level {
  width: 5.9rem;
}

.account-progress-skeleton__chevron {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 640px) {
  .account-progress-skeleton__chip--coins {
    width: 7.6rem;
  }

  .account-progress-skeleton__chip--level {
    width: 5.2rem;
  }

  .account-progress-skeleton__top {
    gap: 0.55rem;
  }

  .account-progress-skeleton__controls {
    gap: 0.5rem;
  }

  .account-progress-skeleton__chip {
    min-height: 2.5rem;
  }

  .account-progress-skeleton__chevron {
    width: 2.1rem;
    height: 2.1rem;
  }
}
</style>
