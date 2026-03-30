<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const { session, hydrated } = usePlayerSession()
const mounted = ref(false)
const sessionReady = computed(() => mounted.value && hydrated.value)

const primaryCta = computed(() => {
  if (sessionReady.value && session.value?.name?.trim()) {
    return {
      label: 'Go to Lobby',
      to: '/lobby',
    }
  }

  return {
    label: 'Back to Home',
    to: '/',
  }
})

const journeySteps = [
  {
    title: '1. Get to the lobby',
    body: 'Sign in, open the lobby, and either create a room or join one that already has open seats. You can create up to 10 rooms per UTC day, but you can still join existing rooms anytime.',
  },
  {
    title: '2. Start with the seven of spades',
    body: 'The player holding 7 of spades begins. That card is placed automatically to open the table.',
  },
  {
    title: '3. Build outward from each 7',
    body: 'Every suit forms its own lane. Once a 7 is on the table, that lane can grow downward toward Ace and upward toward King.',
  },
  {
    title: '4. Pass only when you must',
    body: 'If none of your cards can legally extend any lane, you pass and wait for the table to change.',
  },
  {
    title: '5. Empty your hand first',
    body: 'The round ends the moment a player gets rid of all their cards.',
  },
]

const playExamples = [
  'If 7 hearts is on the table, you can play 6 hearts or 8 hearts.',
  'If a lane shows 5 through 9 of clubs, the next club must be 4 or 10.',
  'You cannot start a new suit with any card other than a 7.',
]

const tips = [
  'Keep an eye on blocked suits. A single card can prevent other players from opening up their hands.',
  'Low cards and high cards are equally valuable. Saving both ends gives you more options later.',
  'If you create a room, you can add AI bots to fill empty seats and start faster.',
]

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <div
    class="instructions-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.9)), url(${backgroundGame})` }"
  >
    <header class="instructions-page__header">
      <NuxtLink :to="primaryCta.to" class="instructions-page__back">
        ← {{ primaryCta.label }}
      </NuxtLink>
      <AppUserMenu />
    </header>

    <main class="instructions-page__content">
      <section class="instructions-hero">
        <p class="instructions-hero__eyebrow">How To Play</p>
        <h1 class="instructions-hero__title">Sevens Royale Instructions</h1>
        <p class="instructions-hero__description">
          This guide is designed for the first-time player journey: get into a room, understand
          what you are seeing on the table, and know exactly what to do on your turn.
        </p>

        <div class="instructions-hero__actions">
          <NuxtLink :to="primaryCta.to" class="instructions-hero__primary">
            {{ primaryCta.label }}
          </NuxtLink>
          <NuxtLink to="/" class="instructions-hero__secondary">
            Home
          </NuxtLink>
        </div>
      </section>

      <section class="instructions-card">
        <div class="instructions-card__heading">
          <h2>Player Journey</h2>
          <p>What a new player needs to know, in the order they experience the game.</p>
        </div>

        <div class="journey-grid">
          <article
            v-for="step in journeySteps"
            :key="step.title"
            class="journey-step"
          >
            <h3>{{ step.title }}</h3>
            <p>{{ step.body }}</p>
          </article>
        </div>
      </section>

      <section class="instructions-layout">
        <article class="instructions-card">
          <div class="instructions-card__heading">
            <h2>Core Rules</h2>
            <p>The short version you can keep in mind during live play.</p>
          </div>

          <ul class="instructions-list">
            <li>Each suit has its own lane: hearts, diamonds, clubs, and spades.</li>
            <li>A lane opens only when its 7 is played.</li>
            <li>After that, cards in the same suit must extend the lane by exactly one rank.</li>
            <li>You may only pass when you have no legal card to play.</li>
            <li>The first player to empty their hand wins.</li>
          </ul>
        </article>

        <article class="instructions-card">
          <div class="instructions-card__heading">
            <h2>Examples</h2>
            <p>Quick mental checks that help during your turn.</p>
          </div>

          <ul class="instructions-list">
            <li
              v-for="example in playExamples"
              :key="example"
            >
              {{ example }}
            </li>
          </ul>
        </article>
      </section>

      <section class="instructions-layout">
        <article class="instructions-card">
          <div class="instructions-card__heading">
            <h2>Inside The App</h2>
            <p>How the main screens map to your flow.</p>
          </div>

          <ul class="instructions-list">
            <li><strong>Home:</strong> sign in and enter the game.</li>
            <li><strong>Lobby:</strong> create a room, join an existing room, or rejoin a game you were already in. Room creation is limited to 10 per UTC day.</li>
            <li><strong>Room:</strong> wait for players, add bots, and then enter the live game board.</li>
            <li><strong>Game board:</strong> watch the suit lanes, choose a legal card, or pass when no move exists.</li>
          </ul>
        </article>

        <article class="instructions-card">
          <div class="instructions-card__heading">
            <h2>Helpful Tips</h2>
            <p>Small strategic habits that make the first few games smoother.</p>
          </div>

          <ul class="instructions-list">
            <li
              v-for="tip in tips"
              :key="tip"
            >
              {{ tip }}
            </li>
          </ul>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.instructions-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding:
    max(1.25rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(2rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  color: #f8fafc;
  background-size: cover;
  background-position: center;
}

.instructions-page__header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.instructions-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.95rem;
  font-weight: 600;
}

.instructions-page__content {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
}

.instructions-hero,
.instructions-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.6rem;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.28);
  backdrop-filter: blur(18px);
}

.instructions-hero {
  padding: 1.5rem;
}

.instructions-hero__eyebrow {
  margin: 0 0 0.8rem;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.instructions-hero__title {
  margin: 0;
  color: #f8f4ec;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 8vw, 4.5rem);
  line-height: 0.95;
}

.instructions-hero__description {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: rgba(226, 232, 240, 0.8);
  font-size: 1rem;
  line-height: 1.7;
}

.instructions-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.4rem;
}

.instructions-hero__primary,
.instructions-hero__secondary {
  min-height: 3.25rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.instructions-hero__primary {
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  color: #17120a;
}

.instructions-hero__secondary {
  border: 1px solid rgba(248, 244, 236, 0.2);
  background: rgba(15, 23, 42, 0.68);
  color: #f8f4ec;
}

.instructions-card {
  padding: 1.35rem;
}

.instructions-card__heading h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}

.instructions-card__heading p {
  margin: 0.4rem 0 0;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.6;
}

.journey-grid,
.instructions-layout {
  display: grid;
  gap: 1rem;
}

.journey-grid {
  margin-top: 1rem;
}

.journey-step {
  padding: 1rem;
  border-radius: 1.2rem;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(245, 158, 11, 0.12);
}

.journey-step h3 {
  margin: 0 0 0.45rem;
  color: #f8f4ec;
  font-size: 1rem;
  font-weight: 800;
}

.journey-step p,
.instructions-list {
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.7;
}

.instructions-list {
  margin: 1rem 0 0;
  padding-left: 1.1rem;
}

.instructions-list li + li {
  margin-top: 0.7rem;
}

@media (min-width: 768px) {
  .instructions-page {
    padding:
      max(1.75rem, env(safe-area-inset-top))
      max(1.5rem, env(safe-area-inset-right))
      max(2.5rem, env(safe-area-inset-bottom))
      max(1.5rem, env(safe-area-inset-left));
  }

  .instructions-hero,
  .instructions-card {
    padding: 1.75rem;
  }

  .journey-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .instructions-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
