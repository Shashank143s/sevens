<script setup lang="ts">
const { isOpen, isNativePlatform, closeAuth, handleGoogleSuccess, signInWithNativeGoogle } = useGoogleLogin()
const acceptedLegal = ref(false)

function onError(err: unknown) {
  console.error('Google sign-in error:', err)
}

function onGoogleSuccess(e: { credential: string; claims: Record<string, unknown> }) {
  if (!acceptedLegal.value) return
  void handleGoogleSuccess(e, new Date().toISOString())
}

async function onNativeGoogleSignIn() {
  if (!acceptedLegal.value) return

  try {
    await signInWithNativeGoogle(new Date().toISOString())
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'SIGN_IN_CANCELED') return
    onError(error)
  }
}

watch(isOpen, (open) => {
  if (!open) {
    acceptedLegal.value = false
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/70 p-0 md:p-4 backdrop-blur-sm"
        @click.self="closeAuth"
      >
        <!-- Backdrop for mobile drawer -->
        <div
          class="absolute inset-0 md:hidden"
          aria-hidden="true"
          @click="closeAuth"
        />

        <!-- Panel: drawer on mobile, modal on desktop -->
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"
          enter-to-class="translate-y-0 md:scale-100 md:opacity-100"
          leave-active-class="transition-transform duration-300 ease-in"
          leave-from-class="translate-y-0 md:scale-100 md:opacity-100"
          leave-to-class="translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"
        >
          <div
            v-if="isOpen"
            class="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <div class="auth-modal__hero">
              <div>
                <p class="auth-modal__eyebrow">Welcome</p>
                <h2
                  id="auth-title"
                  class="auth-modal__title"
                >
                  Sign in
                </h2>
                <p class="auth-modal__subtitle">
                  Continue with your Google account to join games, track coins, and climb the leaderboard.
                </p>
              </div>
              <button
                type="button"
                class="auth-modal__close"
                aria-label="Close"
                @click="closeAuth"
              >
                <span class="text-2xl leading-none">×</span>
              </button>
            </div>

            <div class="auth-modal__body">
              <div class="auth-modal__consent">
                <label class="auth-legal">
                  <span
                    class="auth-legal__toggle"
                    :class="{ 'auth-legal__toggle--on': acceptedLegal }"
                    role="switch"
                    :aria-checked="acceptedLegal ? 'true' : 'false'"
                    tabindex="0"
                    @click="acceptedLegal = !acceptedLegal"
                    @keydown.enter.prevent="acceptedLegal = !acceptedLegal"
                    @keydown.space.prevent="acceptedLegal = !acceptedLegal"
                  >
                    <span class="auth-legal__toggle-thumb" />
                  </span>
                  <span class="auth-legal__copy">
                    I agree to the
                    <NuxtLink to="/privacy-policy" class="auth-legal__link" @click.stop>
                      Privacy Policy
                    </NuxtLink>
                    and
                    <NuxtLink to="/terms-and-conditions" class="auth-legal__link" @click.stop>
                      Terms & Conditions
                    </NuxtLink>.
                  </span>
                </label>
              </div>

              <div v-if="acceptedLegal" class="auth-modal__button-wrap">
                <ClientOnly>
                  <button
                    v-if="isNativePlatform"
                    type="button"
                    class="auth-native-button"
                    @click="onNativeGoogleSignIn"
                  >
                    <span class="auth-native-button__logo">G</span>
                    <span>Continue with Google</span>
                  </button>
                  <GoogleWebLoginButton
                    v-else
                    :options="{ theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'rectangular' }"
                    @success="onGoogleSuccess"
                    @error="onError"
                  />
                </ClientOnly>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal {
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 0;
  border-radius: 1.7rem 1.7rem 0 0;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 28px 70px rgba(2, 6, 23, 0.48);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.auth-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.14), transparent 28%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.12), transparent 34%);
  pointer-events: none;
}

.auth-modal__hero {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.35rem 1.15rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.12), transparent 26%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.1), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96));
}

.auth-modal__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.auth-modal__title {
  margin: 0.45rem 0 0;
  color: #f8fafc;
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1;
}

.auth-modal__subtitle {
  margin: 0.75rem 0 0;
  max-width: 20rem;
  color: rgba(203, 213, 225, 0.78);
  font-size: 0.92rem;
  line-height: 1.65;
}

.auth-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.56);
  color: rgba(226, 232, 240, 0.84);
  flex-shrink: 0;
}

.auth-modal__body {
  position: relative;
  z-index: 1;
  padding: 1.2rem 1.35rem calc(max(1.25rem, env(safe-area-inset-bottom)) + 0.1rem);
}

.auth-modal__consent {
  padding: 0.95rem 1rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.auth-modal__button-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  width: 100%;
  min-width: 200px;
}

.auth-native-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: min(100%, 24rem);
  min-height: 2.75rem;
  padding: 0.8rem 1.1rem;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #f8fafc 0%, #dbe4f0 100%);
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.32);
}

.auth-native-button__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  background: #fff;
  color: #4285f4;
  font-size: 1rem;
  font-weight: 900;
}

.auth-legal {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.auth-legal__toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 2.9rem;
  height: 1.7rem;
  margin-top: 0.08rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(51, 65, 85, 0.86);
  transition: background-color 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
  cursor: pointer;
}

.auth-legal__toggle--on {
  border-color: rgba(250, 204, 21, 0.34);
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.95), rgba(245, 158, 11, 0.88));
}

.auth-legal__toggle-thumb {
  width: 1.18rem;
  height: 1.18rem;
  margin-left: 0.2rem;
  border-radius: 999px;
  background: #f8fafc;
  box-shadow: 0 4px 10px rgba(2, 6, 23, 0.24);
  transition: transform 0.2s ease;
}

.auth-legal__toggle--on .auth-legal__toggle-thumb {
  transform: translateX(1.16rem);
}

.auth-legal__copy {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.86rem;
  line-height: 1.55;
}

.auth-legal__link {
  color: #fde68a;
  font-weight: 700;
}

@media (min-width: 768px) {
  .auth-modal {
    max-width: 26rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.7rem;
  }

  .auth-modal__hero {
    padding: 1.4rem 1.45rem 1.2rem;
  }

  .auth-modal__body {
    padding: 1.25rem 1.45rem 1.4rem;
  }
}
</style>
