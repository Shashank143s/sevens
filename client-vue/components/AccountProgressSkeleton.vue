<template>
  <section class="account-progress-skeleton animate-pulse" aria-hidden="true">
    <div class="account-progress-skeleton__top">
      <div class="account-progress-skeleton__chip account-progress-skeleton__chip--coins" />
      <div class="account-progress-skeleton__chip account-progress-skeleton__chip--level" />
    </div>

    <div class="account-progress-skeleton__body">
      <div class="account-progress-skeleton__label" />
      <div class="account-progress-skeleton__value" />
      <div class="account-progress-skeleton__track">
        <div class="account-progress-skeleton__fill" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-progress-skeleton {
  margin-top: 1.1rem;
  padding: 1rem 1.05rem;
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
  flex-wrap: wrap;
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

.account-progress-skeleton__body {
  margin-top: 0.95rem;
}

.account-progress-skeleton__label {
  width: 11rem;
  max-width: 100%;
  height: 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
}

.account-progress-skeleton__value {
  width: 7rem;
  max-width: 100%;
  height: 1.35rem;
  margin-top: 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
}

.account-progress-skeleton__track {
  overflow: hidden;
  width: 100%;
  height: 0.7rem;
  margin-top: 1rem;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.account-progress-skeleton__fill {
  width: 62%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.72), rgba(250, 204, 21, 0.82));
  opacity: 0.7;
}

@media (max-width: 640px) {
  .account-progress-skeleton__chip--coins {
    width: 7.6rem;
  }

  .account-progress-skeleton__chip--level {
    width: 5.2rem;
  }

  .account-progress-skeleton__label {
    width: 9.8rem;
  }
}
</style>
