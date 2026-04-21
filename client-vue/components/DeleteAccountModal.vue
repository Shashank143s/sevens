<script setup lang="ts">
defineProps<{
  open: boolean
  deleting: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const { isCompact } = useUiDensity()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="account-dialog"
      :class="{ 'account-dialog--compact': isCompact }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div class="account-dialog__backdrop" @click="emit('close')" />
      <section class="account-dialog__panel">
        <header class="account-dialog__header">
          <p class="account-card__eyebrow">Confirm</p>
          <h2 id="delete-account-title">Delete your account?</h2>
        </header>
        <div class="account-dialog__body">
          <p class="account-dialog__copy">
            Your account will be deactivated now and scheduled for permanent deletion after 30 days.
            You will be signed out of Sevens Royale on this device.
          </p>

          <div class="account-dialog__actions">
            <button
              type="button"
              class="account-card__secondary"
              :disabled="deleting"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="account-card__danger"
              :disabled="deleting"
              @click="emit('confirm')"
            >
              {{ deleting ? 'Deleting...' : 'Delete Account' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.account-dialog {
  position: fixed;
  inset: 0;
  z-index: 52;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.account-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(8px);
}

.account-dialog__panel {
  position: relative;
  width: min(100%, 28rem);
  border-radius: 1.5rem;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 55px rgba(2, 6, 23, 0.45);
  overflow: hidden;
}

.account-dialog__header {
  padding: 1.2rem 1.35rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.1), transparent 28%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.08), transparent 35%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96));
}

.account-dialog__body {
  padding: 1.1rem 1.35rem 1.2rem;
}

.account-dialog__panel h2 {
  margin: 0.3rem 0 0;
  color: #f8f4ec;
}

.account-dialog__copy {
  margin: 0;
  line-height: 1.58;
  color: rgba(203, 213, 225, 0.84);
}

.account-dialog__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.85rem;
  margin-top: 1.05rem;
}

.account-dialog__actions > * {
  flex: 1 1 0;
}

.account-card__secondary {
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #f8fafc;
  white-space: nowrap;
}

.account-card__danger {
  width: 100%;
  background: rgba(153, 27, 27, 0.92);
  border: 1px solid rgba(252, 165, 165, 0.4);
  color: #fff1f2;
}

.account-card__secondary,
.account-card__danger {
  min-height: 3.25rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.account-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.account-dialog--compact {
  padding: 0.65rem;
}

.account-dialog--compact .account-dialog__panel {
  width: min(100%, 22.75rem);
  border-radius: 1.05rem;
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.42);
}

.account-dialog--compact .account-dialog__header {
  padding: 0.8rem 0.9rem 0.72rem;
}

.account-dialog--compact .account-dialog__body {
  padding: 0.82rem 0.9rem 0.9rem;
}

.account-dialog--compact .account-card__eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.18em;
}

.account-dialog--compact .account-dialog__panel h2 {
  margin-top: 0.2rem;
  font-size: 1.02rem;
  line-height: 1.2;
}

.account-dialog--compact .account-dialog__copy {
  font-size: 0.76rem;
  line-height: 1.36;
}

.account-dialog--compact .account-dialog__actions {
  gap: 0.55rem;
  margin-top: 0.75rem;
}

.account-dialog--compact .account-card__secondary,
.account-dialog--compact .account-card__danger {
  min-height: 2.4rem;
  border-radius: 0.78rem;
  padding: 0.58rem 0.72rem;
  font-size: 0.83rem;
}

@media (max-width: 420px) {
  .account-dialog__actions {
    gap: 0.65rem;
  }
}
</style>
