# Outreach Command Center

A calm, premium control room for EX Venture's multi-account LinkedIn recruiting
outreach. It sources candidates, drafts a personalised message for each one, and
lets a human review and send it — **you** click send inside your own LinkedIn.

> **Important, by design:** this app never sends anything to LinkedIn
> automatically. It prepares the message; a person sends it. LinkedIn's terms
> forbid automation, so there is deliberately no scraping, browser automation, or
> auto-send anywhere in this code.

---

## What you get

- **Dashboard** – animated KPIs, a 7-day activity chart, and a quota ring per account.
- **Daily Send Queue** – the core screen. One candidate at a time, an editable
  AI-drafted note (capped at 300 characters), and keyboard shortcuts.
- **Account Health** – per-account daily/weekly usage with a hard block at
  20/day and 90/week.
- **Pipeline** – a drag-and-drop Kanban board of candidates by stage.
- **Settings** – message templates, tone, daily target, and a reply classifier.

It ships with **20 fake candidates and 3 accounts**, so everything works
immediately — before you add any API keys.

---

## Setup (about 2 minutes)

You need **Node.js 18 or newer** installed ([download here](https://nodejs.org)).
Then, in a terminal, from this folder:

**1. Install the pieces the app needs**
```bash
npm install
```

**2. Start the app**
```bash
npm run dev
```

This starts two things at once:
- the **web app** at **http://localhost:5173** (open this in your browser)
- the **backend** at http://localhost:5174 (this is what holds your keys)

That's it. Open http://localhost:5173 and click around.

To stop it, press `Ctrl + C` in the terminal.

---

## Adding your API keys (optional, do this whenever you're ready)

The app is fully usable without keys — it uses realistic sample text. When you
want real AI messages and real reply classification:

1. Make a copy of the example file and name it `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and paste your keys:
   ```
   MANATAL_API_KEY=your_real_manatal_key
   DEEPSEEK_API_KEY=your_real_deepseek_key
   ```
3. Stop the app (`Ctrl + C`) and start it again with `npm run dev`.

**Your keys stay private.** They live only in `.env`, which is read by the
backend and never sent to the browser. `.env` is git-ignored so it can't be
committed by accident. Settings → Connections will show a green "Connected"
badge once a key is detected.

---

## Keyboard shortcuts (on the Send Queue screen)

| Key | Action |
| --- | --- |
| `S` | Mark as sent |
| `K` | Skip |
| `R` | Regenerate the message |

(These are ignored while you're typing in the message box.)

---

## How it's built

```
package.json          One `npm run dev` starts the web app + backend together.
vite.config.js        Sends the browser's /api calls to the backend (keeps keys private).
.env.example          Placeholder key names. Copy to .env and add real keys.

server/               The backend — the ONLY thing that talks to Manatal / DeepSeek.
  index.js            The API endpoints + the per-account safety limits.
  ai.js               DeepSeek: draft a message, classify a reply (with local fallback).
  store.js            Reads/writes the local JSON "database".
  seed.js             The 20 fake candidates + 3 accounts.
  data/db.json        Created automatically on first run (git-ignored).

src/
  lib/data.js         ⭐ THE single data layer — every read/write goes through here.
  lib/format.js       Small display helpers (colours, labels, times).
  components/          Reusable UI (cards, ring, chart, toasts, skeletons).
  screens/            The five screens.
```

### Storage
For development, all data lives in one JSON file at `server/data/db.json`. It's
created automatically from the seed data the first time you run the app. To wipe
it back to the fresh 20-candidate demo, use **Settings → Reset demo data** (or run
`npm run seed`).

---

## Moving to Base44 later

Everything the app reads or writes goes through **one file**:
`src/lib/data.js`. No screen calls an API directly. When you're ready to store
data in Base44, open that file — each function has a `// BASE44:` comment showing
the single line to swap in (for example, `getCandidates()` becomes
`Candidate.list()`). Change only that file and the five screens keep working
untouched.

Keep the AI calls (`generateMessage`, `classifyReply`) pointed at a backend or a
Base44 backend function, so your DeepSeek key is never exposed in the browser.

---

## The safety rule, in code

The 20/day and 90/week limits are enforced on the **backend** (`server/index.js`),
not just hidden in the UI — so they can't be bypassed from the browser. When an
account reaches a limit, the Send Queue disables the send button and shows a
clear warning, and Account Health turns that account red.
