const KEY = 'morse-trainer.v1'

const DEFAULTS = {
  settings: {
    charWpm: 18,
    effectiveWpm: 12,
    pitch: 600,
    volume: 0.22,
    paddleSwap: false,
    groupSize: 5,
    showPattern: false,
  },
  learn: {
    unlockedCount: 2,
    history: [],
    lettersOnly: true,
  },
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return clone(DEFAULTS)
    const parsed = JSON.parse(raw)
    return {
      settings: { ...DEFAULTS.settings, ...parsed.settings },
      learn: {
        ...DEFAULTS.learn,
        ...parsed.learn,
        history: Array.isArray(parsed.learn?.history) ? parsed.learn.history : [],
      },
    }
  } catch {
    return clone(DEFAULTS)
  }
}

let state = load()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function getSettings() {
  return { ...state.settings }
}

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch }
  if (state.settings.effectiveWpm > state.settings.charWpm) {
    state.settings.effectiveWpm = state.settings.charWpm
  }
  persist()
  return getSettings()
}

export function getLearn() {
  return {
    unlockedCount: state.learn.unlockedCount,
    history: [...state.learn.history],
    lettersOnly: state.learn.lettersOnly,
  }
}

export function setLearn(patch) {
  state.learn = { ...state.learn, ...patch }
  persist()
  return getLearn()
}

export function resetLearn() {
  state.learn = clone(DEFAULTS.learn)
  persist()
  return getLearn()
}

export function resetAll() {
  state = clone(DEFAULTS)
  persist()
  return load()
}
