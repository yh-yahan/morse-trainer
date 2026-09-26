export const MORSE = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  0: '-----',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-',
}

export const FROM_MORSE = Object.fromEntries(
  Object.entries(MORSE).map(([ch, pat]) => [pat, ch]),
)

export function normalizeChar(ch) {
  const up = String(ch).toUpperCase()
  return up in MORSE ? up : null
}

export function encodeChar(ch) {
  const key = normalizeChar(ch)
  return key ? MORSE[key] : null
}

export function decodePattern(pattern) {
  if (!pattern) return null
  return FROM_MORSE[pattern] ?? null
}

export function prettyPattern(pattern) {
  return String(pattern)
    .replaceAll('.', '·')
    .replaceAll('-', '−')
}

export function encodeText(text) {
  return [...String(text).toUpperCase()].map((ch) => {
    if (ch === ' ') return { type: 'space', ch }
    const pattern = MORSE[ch]
    if (!pattern) return { type: 'skip', ch }
    return { type: 'char', ch, pattern }
  })
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const DIGITS = '0123456789'.split('')
export const PUNCT = ['.', ',', '?', '/', '=']
