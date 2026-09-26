import { encodeText } from './morse.js'
import { getSettings } from './store.js'

let ctx = null
let master = null
let sidetone = null
let gate = null
let playBus = null
let playToken = 0
let activeOsc = []

function timing(charWpm, effectiveWpm) {
  const char = Math.max(5, charWpm)
  const eff = Math.max(5, Math.min(effectiveWpm || char, char))
  const dit = 1200 / char
  const fDit = 1200 / eff
  return {
    dit,
    dah: dit * 3,
    intra: dit,
    interChar: fDit * 3,
    interWord: fDit * 7,
  }
}

async function ensure() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = getSettings().volume
    master.connect(ctx.destination)

    sidetone = ctx.createOscillator()
    gate = ctx.createGain()
    gate.gain.value = 0
    sidetone.type = 'sine'
    sidetone.frequency.value = getSettings().pitch
    sidetone.connect(gate).connect(master)
    sidetone.start()
    newPlayBus()
  }
  if (ctx.state === 'suspended') await ctx.resume()
  applySettings()
  return ctx
}

function applySettings() {
  if (!ctx) return
  const { pitch, volume } = getSettings()
  if (sidetone) sidetone.frequency.setTargetAtTime(pitch, ctx.currentTime, 0.01)
  if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02)
}

export async function unlockAudio() {
  await ensure()
}

export function applyAudioSettings() {
  applySettings()
}

export function toneOn() {
  if (!ctx || !gate) return
  applySettings()
  const now = ctx.currentTime
  gate.gain.cancelScheduledValues(now)
  gate.gain.setTargetAtTime(1, now, 0.004)
}

export function toneOff() {
  if (!ctx || !gate) return
  const now = ctx.currentTime
  gate.gain.cancelScheduledValues(now)
  gate.gain.setTargetAtTime(0, now, 0.006)
}

function newPlayBus() {
  if (playBus) {
    try {
      playBus.disconnect()
    } catch {
      /* already disconnected */
    }
  }
  playBus = ctx.createGain()
  playBus.gain.value = 1
  playBus.connect(master)
}

function scheduleBeep(start, durationSec, freq, vol) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const attack = Math.min(0.004, durationSec / 4)
  const release = Math.min(0.006, durationSec / 3)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(vol, start + attack)
  g.gain.setValueAtTime(vol, start + durationSec - release)
  g.gain.linearRampToValueAtTime(0, start + durationSec)
  osc.connect(g).connect(playBus)
  osc.start(start)
  osc.stop(start + durationSec + 0.02)
  activeOsc.push(osc)
  osc.onended = () => {
    activeOsc = activeOsc.filter((item) => item !== osc)
  }
}

export function stopPlay() {
  playToken += 1
  toneOff()
  if (!ctx) return
  const now = ctx.currentTime
  if (playBus) {
    playBus.gain.cancelScheduledValues(now)
    playBus.gain.setValueAtTime(0, now)
  }
  for (const osc of activeOsc) {
    try {
      osc.stop(now)
    } catch {
      /* already stopped */
    }
  }
  activeOsc = []
  if (master) newPlayBus()
}

export async function playText(text, options = {}) {
  await ensure()
  stopPlay()
  const token = playToken
  const settings = getSettings()
  const charWpm = options.charWpm ?? settings.charWpm
  const effectiveWpm = options.effectiveWpm ?? settings.effectiveWpm
  const pitch = options.pitch ?? settings.pitch
  const { dit, dah, intra, interChar, interWord } = timing(charWpm, effectiveWpm)

  const tokens = encodeText(text)
  let t = ctx.currentTime + 0.06
  const startAt = t

  for (const tokenItem of tokens) {
    if (tokenItem.type === 'space') {
      t += interWord / 1000
      continue
    }
    if (tokenItem.type !== 'char') continue
    const marks = [...tokenItem.pattern]
    for (let i = 0; i < marks.length; i++) {
      const dur = (marks[i] === '-' ? dah : dit) / 1000
      scheduleBeep(t, dur, pitch, 1)
      t += dur
      if (i < marks.length - 1) t += intra / 1000
    }
    t += interChar / 1000
  }

  const totalMs = Math.max(0, (t - startAt) * 1000)
  await sleep(totalMs + 20)
  if (token !== playToken) throw new DOMException('aborted', 'AbortError')
}

export function ditMsFromSettings() {
  const { charWpm } = getSettings()
  return 1200 / Math.max(5, charWpm)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
