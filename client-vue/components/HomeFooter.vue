<script setup lang="ts">
const { isAndroidApp } = useAppSource()
const showBlogLink = computed(() => !isAndroidApp.value)
</script>

<template>
  <footer class="home-footer" aria-label="Sevens Royale information">
    <div class="home-footer__inner">
      <p class="home-footer__copy">
        Sevens Royale is a multiplayer card game with secure Google Sign-In for account access and sync across devices.
      </p>
      <nav class="home-footer__links">
        <NuxtLink to="/instructions" class="home-footer__link">
          Instructions
        </NuxtLink>
        <NuxtLink v-if="showBlogLink" to="/blog" class="home-footer__link">
          Blog
        </NuxtLink>
        <NuxtLink to="/privacy-policy" class="home-footer__link">
          Privacy Policy
        </NuxtLink>
        <NuxtLink to="/terms-and-conditions" class="home-footer__link">
          Terms
        </NuxtLink>
        <NuxtLink to="/contact" class="home-footer__link">
          Contact
        </NuxtLink>
      </nav>
      <p class="home-footer__copyright">
        &copy; 2026
        <a
          class="home-footer__brand-link"
          href="https://play.google.com/store/apps/developer?id=DROIDKING+DEVELOPERS"
          target="_blank"
          rel="noopener noreferrer"
        >
          Droidking Developers
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.home-footer {
  position: relative;
  z-index: 1;
  width: 100%;
  padding:
    0.9rem
    max(1.25rem, env(safe-area-inset-right))
    max(0.9rem, env(safe-area-inset-bottom))
    max(1.25rem, env(safe-area-inset-left));
  background: linear-gradient(180deg, rgba(4, 20, 13, 0.16), rgba(4, 20, 13, 0.82) 18%, rgba(6, 20, 31, 0.96));
  border-top: 1px solid rgba(248, 244, 236, 0.08);
}

.home-footer__inner {
  width: min(100%, 68rem);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.home-footer__copy {
  margin: 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 0.74rem;
  line-height: 1.4;
  text-align: center;
}

.home-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem 0.9rem;
}

.home-footer__link {
  color: #e4c862;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
}

.home-footer__link:hover,
.home-footer__link:focus-visible {
  color: #f8e39a;
  text-decoration: underline;
}

.home-footer__copyright {
  margin: 0;
  color: rgba(148, 163, 184, 0.68);
  font-size: 0.72rem;
  line-height: 1.35;
  text-align: center;
}

.home-footer__brand-link {
  color: #e4c862;
  font-weight: 700;
  text-decoration: none;
}

.home-footer__brand-link:hover,
.home-footer__brand-link:focus-visible {
  color: #f8e39a;
  text-decoration: underline;
}

@media (min-width: 640px) {
  .home-footer {
    padding:
      1rem
      max(2rem, env(safe-area-inset-right))
      max(0.95rem, env(safe-area-inset-bottom))
      max(2rem, env(safe-area-inset-left));
  }

  .home-footer__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1.25rem;
  }

  .home-footer__copy {
    max-width: 40rem;
    font-size: 0.86rem;
    text-align: left;
  }

  .home-footer__links {
    justify-content: flex-end;
    gap: 0.85rem 1.2rem;
    flex-shrink: 0;
  }

  .home-footer__link {
    font-size: 0.84rem;
  }

  .home-footer__copyright {
    grid-column: 1 / -1;
    font-size: 0.76rem;
    text-align: left;
  }
}
</style>
