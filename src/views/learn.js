import { renderShell } from '../ui/shell.js'
import { paddlesMarkup, straightKeyMarkup, bindKeyerControls } from '../ui/paddles.js'
import {
  currentSet,
  nextLetter,
  pickGroup,
  recordReceive,
  recentStats,
  tryUnlock,
} from '../app/koch.js'
import { getSettings } from '../app/store.js'
import { playText, stopPlay, unlockAudio } from '../app/audio.js'
import { createKeyer } from '../app/keyer.js'
import { encodeChar, prettyPattern } from '../app/morse.js'

export function renderLearn(root) {
  let mode = 'receive'
  let group = pickGroup(getSettings().groupSize)
  let playing = false
  let sendTarget = group[0]
  let unbindKeyer = null
  const keyer = createKeyer({
    onElement(_el, pattern) {
      const live = root.querySelector('[data-live]')
      if (live) live.textContent = prettyPattern(pattern)
    },
    onChar(ch) {
      gradeSend(ch)
    },
  })

  function statsLine() {
    const stats = recentStats()
    const next = nextLetter()
    const acc = stats.total ? `${Math.round(stats.accuracy * 100)}%` : '—'
    return `Set ${currentSet().join(' ')} · ${acc} of last ${stats.total}${next ? ` · next ${next}` : ''}`
  }

  function draw() {
    unbindKeyer?.()
    const settings = getSettings()
    renderShell(root, {
      active: 'learn',
      title: 'Learn',
      subtitle: statsLine(),
      body: `
        <div class="flex gap-2 mb-4">
          <button data-mode="receive" class="${chip(mode === 'receive')}">Receive</button>
          <button data-mode="send" class="${chip(mode === 'send')}">Send</button>
        </div>
        ${mode === 'receive' ? receiveBody(settings) : sendBody()}
      `,
    })

    root.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.onclick = () => {
        stopPlay()
        keyer.reset()
        mode = btn.dataset.mode
        draw()
      }
    })

    if (mode === 'receive') bindReceive()
    else bindSend()
  }

  function receiveBody(settings) {
    return `
      <p class="text-sm text-zinc-400 mb-3">Listen to a group, then type what you heard.</p>
      <input data-answer maxlength="32" autocomplete="off" autocapitalize="off" spellcheck="false"
        class="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-3 text-lg tracking-[0.3em] uppercase"
        placeholder="type here" />
      <div class="flex gap-2 mt-3">
        <button data-play class="flex-1 rounded-md bg-lime-400 py-3 font-semibold text-zinc-950">Play</button>
        <button data-stop class="rounded-md border border-zinc-700 px-4 py-3">Stop</button>
        <button data-submit class="flex-1 rounded-md border border-zinc-700 py-3">Check</button>
      </div>
      ${settings.showPattern ? `
        <p data-pattern class="mt-3 text-lime-300 tracking-[0.35em]">${patternLine(group)}</p>
        <p data-set-morse class="mt-2 text-xs text-zinc-400 leading-6">${setMorseLine()}</p>
      ` : ''}
      <p data-result class="mt-4 min-h-12 text-sm text-zinc-300"></p>
    `
  }

  function sendBody() {
    return `
      <p class="text-sm text-zinc-400 mb-2">Key this letter</p>
      <p class="text-5xl font-semibold text-center py-4">${sendTarget}</p>
      <p data-live class="text-center text-lime-300 tracking-[0.4em] min-h-6"></p>
      <p data-result class="text-center text-sm min-h-6 mb-4"></p>
      <div class="mb-3">${straightKeyMarkup()}</div>
      ${paddlesMarkup()}
      <button data-next class="mt-3 w-full rounded-md border border-zinc-700 py-3">Skip</button>
    `
  }

  function bindReceive() {
    const input = root.querySelector('[data-answer]')
    const result = root.querySelector('[data-result]')
    root.querySelector('[data-play]').onclick = async () => {
      if (playing) return
      playing = true
      result.textContent = 'Playing…'
      try {
        await unlockAudio()
        await playText(group.join(''))
        result.textContent = 'Your turn'
        input.focus()
      } catch {
        result.textContent = ''
      } finally {
        playing = false
      }
    }
    root.querySelector('[data-stop]').onclick = () => {
      stopPlay()
      playing = false
      result.textContent = 'Stopped'
    }
    const submit = () => {
      const scored = recordReceive(group, input.value)
      const unlocked = tryUnlock()
      result.innerHTML = scored.details
        .map((d) => `<span class="${d.ok ? 'text-emerald-400' : 'text-red-400'}">${d.expected}</span>`)
        .join(' ')
        + (unlocked ? `<div class="mt-2 text-lime-400">New letter: ${unlocked}</div>` : '')
      group = pickGroup(getSettings().groupSize)
      input.value = ''
      const sub = root.querySelector('[data-subtitle]')
      if (sub) sub.textContent = statsLine()
      const pattern = root.querySelector('[data-pattern]')
      if (pattern) pattern.textContent = patternLine(group)
      const setMorse = root.querySelector('[data-set-morse]')
      if (setMorse) setMorse.innerHTML = setMorseLine()
    }
    root.querySelector('[data-submit]').onclick = submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit()
    })
  }

  function bindSend() {
    unbindKeyer = bindKeyerControls(root, keyer)
    root.querySelector('[data-next]').onclick = () => {
      keyer.reset()
      nextSendTarget()
      draw()
    }
  }

  function gradeSend(ch) {
    const result = root.querySelector('[data-result]')
    const live = root.querySelector('[data-live]')
    const ok = ch === sendTarget
    if (result) {
      result.textContent = ok ? `Yes, ${sendTarget}` : `${ch ?? '?'} — want ${sendTarget}`
      result.className = `text-center text-sm min-h-6 mb-4 ${ok ? 'text-emerald-400' : 'text-red-400'}`
    }
    if (live) live.textContent = ''
    window.setTimeout(() => {
      nextSendTarget()
      const letter = root.querySelector('main p.text-5xl')
      if (letter) letter.textContent = sendTarget
      if (result) result.textContent = ''
    }, 700)
  }

  function nextSendTarget() {
    const set = currentSet()
    sendTarget = set[Math.floor(Math.random() * set.length)]
  }

  draw()
  return () => {
    stopPlay()
    keyer.reset()
    unbindKeyer?.()
  }
}

function chip(on) {
  return `rounded-full px-3 py-1 text-sm ${on ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`
}

function patternLine(chars) {
  return chars.map((ch) => prettyPattern(encodeChar(ch) || '')).join('   ')
}

function setMorseLine() {
  return currentSet()
    .map((ch) => `<span class="mr-3"><span class="text-zinc-200">${ch}</span> ${prettyPattern(encodeChar(ch) || '')}</span>`)
    .join('')
}
