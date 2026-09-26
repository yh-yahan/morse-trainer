import { getLearn, setLearn } from './store.js'

/** LCWO-style Koch order. */
export const KOCH_ORDER = [
  'K', 'M', 'U', 'R', 'E', 'S', 'N', 'A', 'P', 'T',
  'L', 'W', 'I', '.', 'J', 'Z', '=', 'F', 'O', 'Y',
  ',', 'V', 'G', '5', '/', 'Q', '9', '2', 'H', '3',
  '8', 'B', '?', '4', '7', 'C', '1', 'D', '6', '0', 'X',
]

export const KOCH_LETTERS = KOCH_ORDER.filter((ch) => /[A-Z]/.test(ch))

const WINDOW = 50
const UNLOCK_ACCURACY = 0.9

export function order() {
  return getLearn().lettersOnly ? KOCH_LETTERS : KOCH_ORDER
}

export function currentSet() {
  const { unlockedCount } = getLearn()
  const list = order()
  return list.slice(0, Math.max(2, Math.min(unlockedCount, list.length)))
}

export function nextLetter() {
  const set = currentSet()
  const list = order()
  return list[set.length] ?? null
}

export function isComplete() {
  return !nextLetter()
}

export function pickGroup(size = 5) {
  const set = currentSet()
  const weights = set.map((_, i) => (i >= set.length - 2 ? 3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const out = []
  for (let n = 0; n < size; n++) {
    let roll = Math.random() * total
    let chosen = set[0]
    for (let i = 0; i < set.length; i++) {
      roll -= weights[i]
      if (roll <= 0) {
        chosen = set[i]
        break
      }
    }
    out.push(chosen)
  }
  return out
}

function normalizeAnswer(text) {
  return String(text).toUpperCase().replace(/\s+/g, '')
}

export function scoreGroup(expected, typed) {
  const want = expected.map((ch) => ch.toUpperCase())
  const got = normalizeAnswer(typed).split('')
  const details = want.map((ch, i) => ({
    expected: ch,
    typed: got[i] ?? '',
    ok: got[i] === ch,
  }))
  const correct = details.filter((d) => d.ok).length
  return {
    details,
    correct,
    total: want.length,
    ok: correct === want.length && got.length === want.length,
  }
}

export function recordReceive(expected, typed) {
  const result = scoreGroup(expected, typed)
  const learn = getLearn()
  const history = [
    ...learn.history,
    ...result.details.map((d) => ({
      ch: d.expected,
      ok: d.ok,
      at: Date.now(),
    })),
  ].slice(-400)
  setLearn({ history })
  return result
}

export function recentStats(limit = WINDOW) {
  const { history } = getLearn()
  const slice = history.slice(-limit)
  const total = slice.length
  const correct = slice.filter((h) => h.ok).length
  return {
    total,
    correct,
    accuracy: total ? correct / total : 0,
    needed: WINDOW,
  }
}

export function canUnlock() {
  if (isComplete()) return false
  const stats = recentStats(WINDOW)
  return stats.total >= WINDOW && stats.accuracy >= UNLOCK_ACCURACY
}

export function unlockNext() {
  if (!canUnlock()) return null
  const letter = nextLetter()
  if (!letter) return null
  const { unlockedCount, history } = getLearn()
  setLearn({
    unlockedCount: unlockedCount + 1,
    history: history.slice(-10),
  })
  return letter
}

export function tryUnlock() {
  if (!canUnlock()) return null
  return unlockNext()
}
