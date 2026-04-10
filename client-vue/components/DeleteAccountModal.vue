<script setup lang="ts">
defineProps<{
  open: boolean
  deleting: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <div
    v-if="open"
    class="account-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-account-title"
  >
    <div class="account-dialog__backdrop" @click="emit('close')" />
    <section class="account-dialog__panel">
      <p class="account-card__eyebrow">Confirm</p>
      <h2 id="delete-account-title">Delete your account?</h2>
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
    </section>
  </div>
</template>

<style scoped>
.account-dialog {
  position: fixed;
  inset: 0;
  z-index: 40;
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
  padding: 1.4rem;
  border-radius: 1.5rem;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(248, 113, 113, 0.16);
  box-shadow: 0 24px 55px rgba(2, 6, 23, 0.45);
}

.account-dialog__panel h2 {
  margin: 0.35rem 0 0;
  color: #f8f4ec;
}

.account-dialog__copy {
  margin: 0.9rem 0 0;
  line-height: 1.65;
  color: rgba(203, 213, 225, 0.86);
}

.account-dialog__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.85rem;
  margin-top: 1.25rem;
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

@media (max-width: 420px) {
  .account-dialog__actions {
    gap: 0.65rem;
  }
}
</style>
