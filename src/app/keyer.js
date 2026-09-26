import { decodePattern } from './morse.js'
import { ditMsFromSettings, toneOff, toneOn, unlockAudio } from './audio.js'

export function createKeyer(handlers = {}) {
  let pattern = ''
  let charTimer = null
  let wordTimer = null
  let enabled = true
  let straightDownAt = 0
  let paddleRepeat = null
  const held = { dit: false, dah: false }

  function ditMs() {
    return handlers.getDitMs?.() ?? ditMsFromSettings()
  }

  function emit(el) {
    if (!enabled) return
    pattern += el
    handlers.onElement?.(el, pattern)
    armGaps()
  }

  function armGaps() {
    clearTimeout(charTimer)
    clearTimeout(wordTimer)
    const unit = ditMs()
    charTimer = setTimeout(closeChar, unit * 2.4)
    wordTimer = setTimeout(closeWord, unit * 6.5)
  }

  function closeChar() {
    if (!pattern) return
    const ch = decodePattern(pattern)
    const used = pattern
    pattern = ''
    handlers.onChar?.(ch, used)
  }

  function closeWord() {
    if (pattern) closeChar()
    handlers.onWord?.()
  }

  function playElement(el) {
    const unit = ditMs()
    const dur = el === '-' ? unit * 3 : unit
    toneOn()
    window.setTimeout(() => {
      if (!held.dit && !held.dah && !straightDownAt) toneOff()
    }, dur)
    emit(el)
    return dur
  }

  function startRepeat(el) {
    stopRepeat()
    const run = () => {
      if ((el === '.' && !held.dit) || (el === '-' && !held.dah)) return
      const dur = playElement(el)
      paddleRepeat = window.setTimeout(run, dur + ditMs())
    }
    run()
  }

  function stopRepeat() {
    if (paddleRepeat) {
      clearTimeout(paddleRepeat)
      paddleRepeat = null
    }
  }

  function bindHold(el, onDown, onUp) {
    const down = (e) => {
      if (!enabled) return
      e.preventDefault()
      el.setPointerCapture?.(e.pointerId)
      el.dataset.down = 'true'
      onDown(e)
    }
    const up = (e) => {
      el.dataset.down = 'false'
      onUp(e)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }

  function pressStraight() {
    if (!enabled || straightDownAt) return
    straightDownAt = performance.now()
    toneOn()
  }

  function releaseStraight() {
    if (!straightDownAt) return
    const heldMs = performance.now() - straightDownAt
    straightDownAt = 0
    toneOff()
    emit(heldMs < ditMs() * 2 ? '.' : '-')
  }

  function attachStraight(el) {
    return bindHold(el, pressStraight, releaseStraight)
  }

  function typingInField(target) {
    if (!target || typeof target.closest !== 'function') return false
    const el = target.closest('input, textarea, select, [contenteditable="true"]')
    return Boolean(el)
  }

  function attachSpace(el) {
    const down = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      if (e.repeat) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (typingInField(e.target)) return
      if (!enabled) return
      e.preventDefault()
      if (el) el.dataset.down = 'true'
      unlockAudio()
      pressStraight()
    }
    const up = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      if (!straightDownAt) return
      e.preventDefault()
      if (el) el.dataset.down = 'false'
      releaseStraight()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', releaseStraight)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', releaseStraight)
      if (el) el.dataset.down = 'false'
    }
  }

  function attachPaddle(el, kind) {
    return bindHold(
      el,
      () => {
        held[kind] = true
        startRepeat(kind === 'dit' ? '.' : '-')
      },
      () => {
        held[kind] = false
        if (!held.dit && !held.dah) {
          stopRepeat()
          toneOff()
        }
      },
    )
  }

  function reset() {
    pattern = ''
    held.dit = false
    held.dah = false
    straightDownAt = 0
    stopRepeat()
    clearTimeout(charTimer)
    clearTimeout(wordTimer)
    toneOff()
  }

  return {
    attachStraight,
    attachPaddle,
    attachSpace,
    reset,
    setEnabled(value) {
      enabled = value
      if (!enabled) reset()
    },
    flush() {
      closeChar()
    },
  }
}
