# Spelling Bee Jeopardy

A two-round, team-based party game: a Jeopardy-style board where Round 1 is a
round-robin spelling bee and Round 2 is trivia where the answer has to be
spelled correctly. Built as a static React app with no backend — content is
edited as JSON and picked up on refresh.

## Running it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL. That's it for game night —
one laptop connected to a TV/projector runs the whole show.

Other useful commands:

```bash
npm run build     # type-checks and produces a production build in dist/
npm run preview   # serves the built dist/ locally, to sanity-check a build
npm run lint      # oxlint
```

## How the game works

- **Setup tab** — enter team names before playing (add/remove any time, no
  team limit). Round 1 and Round 2 stay locked in the nav until at least 2
  teams exist. Scores persist across both rounds and survive a page refresh
  (stored in the browser's `localStorage`).
- **Round 1 — Spell the Word**: click a board cell and the team spells the
  word out loud, one letter per person going around the circle. The app never
  displays the word — the host reads it from the printed **Answer Key** (see
  below) and clicks which team got it right, or "Nobody got it."
- **Round 2 — Spell the Answer**: click a cell to reveal the clue to
  everyone, exactly like Jeopardy. The team must say (and spell) the correct
  answer; the host judges and clicks the winning team, or "Nobody got it."
- **Reveal**: after judging a tile, the popup switches to show the correct
  word/answer plus who got it (or "Nobody got it") before you continue —
  useful in Round 1 especially, since that's the one round where the word is
  never shown beforehand.
- **Turn order**: whichever team answers a cell correctly picks the next one.
  If nobody gets it, the turn passes to the next team in a fair round-robin
  rotation.
- **Clicked the wrong tile?** Click the ✕ in the clue popup, or click outside
  it, to back out without resolving anything — the tile stays playable.
- **Undo**: the single most-recently-resolved tile shows an "Undo" tile
  instead of the usual done checkmark. Clicking it reverses the points and
  restores whichever team's turn it was before that resolution. Only the
  latest resolution is undoable — resolving another tile supersedes it.
- Scores accumulate across both rounds into one running scoreboard, always
  visible at the top of the screen.
- **Reset** (top-right of the nav, on every page) clears every team, score,
  and answered tile after a confirmation prompt, and returns to Setup. Handy
  for testing or starting a fresh game.

## Editing questions/words

Game content lives in `public/data/round1.json` and `public/data/round2.json`.
Edit either file and refresh the browser — no rebuild needed.

**`round1.json`** — categories of words to spell:

```json
{
  "categories": [
    {
      "name": "California",
      "cells": [
        { "points": 100, "word": "Anaheim", "hint": "Home to Disneyland" }
      ]
    }
  ]
}
```

`hint` is optional context for the host (e.g. to use in a sentence) and,
like `word`, never appears on the board — only on the Answer Key.

**`round2.json`** — categories of trivia clues:

```json
{
  "categories": [
    {
      "name": "Science",
      "cells": [
        {
          "points": 100,
          "clue": "This gas makes up about 78% of Earth's atmosphere.",
          "answer": "Nitrogen"
        }
      ]
    }
  ]
}
```

`clue` is shown on the board when the cell is clicked; `answer` stays hidden
during play. Each category's `cells` should be ordered low points to high.

## Printing the Answer Key

Since the app itself never reveals words/answers during play, the host needs
a reference. Visit these routes once before the event and print them
(Cmd/Ctrl+P) — they're not linked from the nav bar so they won't get clicked
into by accident during a game:

- `/round-1/answer-key`
- `/round-2/answer-key`

Both are generated straight from the same JSON files, so there's only one
source of truth to keep updated.

## Custom sound effects

Drop your own audio files in `public/sounds/correct/`,
`public/sounds/incorrect/`, and `public/sounds/open/`, then list the
filenames in `public/sounds/manifest.json`:

```json
{
  "correct": ["ding.mp3", "tada.mp3", "cheer.mp3"],
  "incorrect": ["buzzer.mp3"],
  "open": ["whoosh.mp3", "boing.mp3"]
}
```

- `correct` plays when a team gets a tile right
- `incorrect` plays on "Nobody got it"
- `open` plays the instant a tile is clicked, timed with the tile's opening
  animation (see below)

Each event picks a random file from its category — so with a few files per
category, it won't play the exact same sound twice in a row. Any
browser-playable audio format works (mp3, wav, ogg). Edit the manifest and
refresh the browser — no rebuild needed, same as the game content.

If a category is empty (or a listed file fails to load), that event falls
back to a plain synthesized beep, so the app always makes *some* sound
without requiring you to supply files first. Mute everything with the
speaker icon in the nav bar.

## Tile opening animation

When a tile is clicked, the clue card spirals in (`src/lib/tileAnimations.ts`)
before showing the prompt. It's built as a pool of variants with one randomly
picked per click — same pattern as the sound effects — currently trimmed
down to a single "spiral-in" animation while more get designed. Add more
entries to the `TILE_ANIMATIONS` array to bring back variety.

## Tech stack

- React + TypeScript + Vite
- React Router (`/setup`, `/round-1`, `/round-2`, plus the two answer-key
  routes)
- Tailwind CSS (Bee Movie–themed yellow/black palette, defined in
  `src/index.css`)
- Framer Motion for tile hover/tap, the clue card's opening animation, and
  the reveal pop
- Sound effects are your own uploaded audio files, randomly chosen per event
  (see above), with a synthesized Web Audio beep as fallback — toggle with
  the speaker icon in the top-right of the nav bar

## Project structure

```
src/
  routes/           Setup, Round1Board, Round2Board, AnswerKey
  components/       Layout, RequireTeams, Scoreboard, JeopardyBoard, Cell, ResolvePanel
  state/            GameStateContext — teams, scores, turn order, cell state, undo
  hooks/            useBoardData (fetches round JSON), useSound
  lib/              tileAnimations — pool of randomized clue-card entrance animations
  types/            Board/cell shapes, game state shapes
public/
  data/             round1.json, round2.json — the editable game content
  sounds/           manifest.json, correct/, incorrect/, open/ — your uploaded sound effects
```

## Known limitations

- No live sync between devices — everything runs from one browser on one
  machine, which is why the answer key is a print-and-read-from-paper
  design rather than a second connected screen.
- Round 1 only tracks right/wrong per word, not individual letters — the
  actual spelling happens live, judged by the host.
