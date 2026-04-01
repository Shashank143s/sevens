export type BlogSection = {
  title: string
  paragraphs: string[]
}

export type BlogScreenshot = {
  src: string
  alt: string
  label?: string
}

export type BlogPost = {
  slug: string
  title: string
  description: string
  excerpt: string
  category: string
  readingTime: string
  keywords: string[]
  previewImage: string
  previewAlt: string
  gallery: BlogScreenshot[]
  sections: BlogSection[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-play-sevens',
    title: 'How To Play Sevens Card Game',
    description: 'Learn how to play Sevens card game online, from opening with the sevens to extending suit runs and planning your hand.',
    excerpt: 'A quick, modern guide to learning Sevens: how turns work, how suit lanes grow from seven, and how to think ahead.',
    category: 'How To Play',
    readingTime: '4 min read',
    keywords: ['sevens card game', 'how to play sevens', 'sevens rules'],
    previewImage: '/screenshots/game-table-start.png',
    previewAlt: 'Sevens Royale game table at the start of a match',
    gallery: [
      {
        src: '/screenshots/game-table-start.png',
        alt: 'Game start screen in Sevens Royale',
        label: 'Game start',
      },
      {
        src: '/screenshots/game-table-pass.png',
        alt: 'A pass state during a Sevens Royale match',
        label: 'Pass state',
      },
    ],
    sections: [
      {
        title: 'Start from the sevens',
        paragraphs: [
          'In Sevens, every suit begins with the seven. Once a seven of hearts, diamonds, clubs, or spades is played, the rest of that suit can grow outward in both directions.',
          'That means six and eight can be played next, then five and nine, then four and ten, and so on until the full suit run is built.',
        ],
      },
      {
        title: 'Your goal each round',
        paragraphs: [
          'The goal is simple: get rid of all your cards before the other players do. Every legal move helps open the table or extend a lane, while every blocked card stays in your hand and limits future turns.',
          'Winning is not just about seeing a move. It is also about shaping the table so the cards you are holding become playable sooner than everyone else.',
        ],
      },
      {
        title: 'How turns feel in Sevens Royale',
        paragraphs: [
          'In Sevens Royale, you create or join a room, sit with friends or bots, and play the same classic sequence-building format in a polished multiplayer layout.',
          'The live table keeps suit lanes visible at a glance, so you can quickly spot what can open next and what values are still locked.',
        ],
      },
    ],
  },
  {
    slug: 'sevens-card-game-rules',
    title: 'Sevens Card Game Rules Explained',
    description: 'A clean breakdown of Sevens card game rules, including turn order, legal plays, passing, and how the round ends.',
    excerpt: 'The clearest version of Sevens rules: what cards are legal, when you are stuck, and how a round is won.',
    category: 'Rules',
    readingTime: '5 min read',
    keywords: ['sevens card game rules', 'sevens rules online', 'card game sevens'],
    previewImage: '/screenshots/game-instructions.png',
    previewAlt: 'Sevens Royale instructions screen',
    gallery: [
      {
        src: '/screenshots/game-instructions.png',
        alt: 'Game instructions page in Sevens Royale',
        label: 'Instructions',
      },
      {
        src: '/screenshots/game-table-pass.png',
        alt: 'Illegal or blocked play state in Sevens Royale',
        label: 'Blocked turn',
      },
      {
        src: '/screenshots/game-complete.png',
        alt: 'Completed game overlay in Sevens Royale',
        label: 'Round complete',
      },
    ],
    sections: [
      {
        title: 'Legal moves only',
        paragraphs: [
          'A card is legal only if it extends an existing suit lane by exactly one step or opens a suit with a seven. If the seven is not on the table yet, other values in that suit cannot be played.',
          'This is what gives Sevens its rhythm. The whole table is built around unlocking suits from the center outward.',
        ],
      },
      {
        title: 'When you cannot play',
        paragraphs: [
          'If none of the cards in your hand can legally extend a lane, you are stuck for that turn. In casual versions of the game this might mean passing. In digital play, the game state handles that cleanly for you.',
          'Being unable to play is part of the strategy. Strong players watch which cards remain hidden and which suits are being deliberately delayed.',
        ],
      },
      {
        title: 'How a round ends',
        paragraphs: [
          'A round ends when one player empties their hand first. That player wins the round, while everyone else is left with cards still in hand.',
          'In Sevens Royale, rounds feed into coins, leaderboard movement, and progression, which makes each finish feel more meaningful than a casual tabletop game.',
        ],
      },
    ],
  },
  {
    slug: 'play-sevens-online',
    title: 'Play Sevens Online With Friends Or Bots',
    description: 'Why playing Sevens online changes the game: instant rooms, private tables, bot matches, and smoother rejoin on modern devices.',
    excerpt: 'From private rooms to quick bot matches, here is why Sevens feels especially good in an online format.',
    category: 'Play Online',
    readingTime: '4 min read',
    keywords: ['play sevens online', 'online sevens card game', 'sevens multiplayer'],
    previewImage: '/screenshots/lobby.png',
    previewAlt: 'Sevens Royale lobby screen',
    gallery: [
      {
        src: '/screenshots/lobby.png',
        alt: 'Lobby page in Sevens Royale',
        label: 'Lobby',
      },
      {
        src: '/screenshots/join-game.png',
        alt: 'Join room flow in Sevens Royale',
        label: 'Join room',
      },
      {
        src: '/screenshots/game-table-start.png',
        alt: 'A started Sevens Royale game',
        label: 'Live table',
      },
    ],
    sections: [
      {
        title: 'Fast room-based play',
        paragraphs: [
          'Sevens Royale is built around rooms, which makes it easy to spin up a quick match and jump straight into the table. You can join public rooms, create private ones, or fill seats with bots.',
          'That structure makes the game easier to revisit than many old-school card sites, because the flow from lobby to room to active match is much tighter.',
        ],
      },
      {
        title: 'Why bots help',
        paragraphs: [
          'Bots are useful for learning the pace of the game, testing opening choices, and playing short matches when other people are not around.',
          'For a strategy-first game like Sevens, even fast bot rounds help you improve lane awareness and hand management.',
        ],
      },
      {
        title: 'Built for quick returns',
        paragraphs: [
          'Because Sevens Royale is available as a web app and installable experience, it is designed for short, repeatable sessions. You can return quickly, rejoin rooms, and keep playing without a heavy setup flow.',
          'That convenience matters a lot for classic card games. The easier the return, the more likely the game becomes part of a daily routine.',
        ],
      },
    ],
  },
  {
    slug: 'seven-up-seven-down-vs-sevens',
    title: 'Seven Up Seven Down And Sevens: Are They The Same?',
    description: 'A simple explanation of how players refer to Sevens as Seven Up or Seven Down, and why the central mechanic stays the same.',
    excerpt: 'Many players search for Seven Up or Seven Down. Here is how those names map back to the same core game.',
    category: 'Guide',
    readingTime: '3 min read',
    keywords: ['seven up seven down', 'seven up seven down card game', 'sevens card game online'],
    previewImage: '/screenshots/home.png',
    previewAlt: 'Sevens Royale home screen',
    gallery: [
      {
        src: '/screenshots/home.png',
        alt: 'Home page for Sevens Royale',
        label: 'Home',
      },
      {
        src: '/screenshots/leaderboard.png',
        alt: 'Leaderboard page in Sevens Royale',
        label: 'Leaderboard',
      },
      {
        src: '/screenshots/game-xp-level.png',
        alt: 'XP and level progression in Sevens Royale',
        label: 'XP & level',
      },
    ],
    sections: [
      {
        title: 'Different names, same core idea',
        paragraphs: [
          'A lot of players know the game as Seven Up Seven Down, while others simply call it Sevens. In practice, these names usually point to the same family of card game rules built around starting from seven and expanding up or down in suit order.',
          'Search behavior varies by region and by family tradition, which is why broad content around both names matters if you want players to find the game online.',
        ],
      },
      {
        title: 'Why the names make sense',
        paragraphs: [
          'The phrase Seven Up Seven Down describes exactly what happens once a seven is on the table: cards can move upward toward king and downward toward ace.',
          'That is the same mechanic Sevens players know well, just described in a more literal way.',
        ],
      },
      {
        title: 'How to think about it online',
        paragraphs: [
          'If you are searching for Seven Up Seven Down online, Sevens Royale is built to satisfy that same game intent: quick sequence-building rounds, room play, bots, coins, and competitive progression.',
          'That is why the game content on this site speaks to both names. The player intent is the same even when the wording differs.',
        ],
      },
    ],
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find(post => post.slug === slug)
}
