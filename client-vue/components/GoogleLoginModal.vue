<script setup lang="ts">
const { isOpen, closeAuth, handleGoogleSuccess } = useGoogleLogin()

function onError(err: unknown) {
  console.error('Google sign-in error:', err)
}
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
        class="fixed inset-0 z-50 flex items-end md:items-center md:justify-center p-0 md:p-4 bg-black/60"
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
            class="relative w-full md:max-w-sm bg-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-600 border-b-0 md:border-b border-slate-600 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] safe-area-padding"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <div class="flex justify-between items-center mb-5">
              <h2
                id="auth-title"
                class="text-xl font-bold text-white"
              >
                Sign in
              </h2>
              <button
                type="button"
                class="text-slate-400 hover:text-white p-1 -mr-1 rounded touch-manipulation"
                aria-label="Close"
                @click="closeAuth"
              >
                <span class="text-2xl leading-none">×</span>
              </button>
            </div>
            <p class="text-slate-400 text-sm mb-6">
              Continue with your Google account to join games.
            </p>
            <div class="flex justify-center min-w-[200px]">
              <ClientOnly>
                <GoogleLoginButton
                  :options="{ theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'rectangular' }"
                  @success="handleGoogleSuccess"
                  @error="onError"
                />
              </ClientOnly>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
