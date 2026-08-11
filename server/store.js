// ---------------------------------------------------------------------------
// Tiny JSON-file storage layer for local development.
//
// This is intentionally simple: the whole "database" is one JSON file at
// server/data/db.json. It is read into memory, mutated, and written back.
// That is plenty for a single-user local tool and keeps setup to zero
// (no SQLite native compile step, no database server to install).
//
// If you later outgrow this, you only need to change THIS file — the rest of
// the backend talks to it through the read()/write() helpers below.
// ---------------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSeed } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(buildSeed(), null, 2))
  }
}

export function read() {
  ensureFile()
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

export function write(db) {
  ensureFile()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  return db
}

// Reset the database back to fresh seed data (used by the "Reset demo data"
// button in Settings).
export function reset() {
  const seed = buildSeed()
  write(seed)
  return seed
}

// Small helper to generate ids without extra dependencies.
export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
