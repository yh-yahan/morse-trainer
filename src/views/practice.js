import { renderShell } from '../ui/shell.js'
import { paddlesMarkup, straightKeyMarkup, bindKeyerControls } from '../ui/paddles.js'
import { DIGITS, LETTERS, PUNCT, prettyPattern } from '../app/morse.js'
import { getSettings } from '../app/store.js'
import { playText, stopPlay, unlockAudio } from '../app/audio.js'
import { createKeyer } from '../app/keyer.js'

export function renderPractice(root) {
  const hash = window.location.hash
  let tab = hash.includes('send') ? 'send' : 'receive'
  let pool = [...LETTERS]
  let poolKind = 'letters'
  let decoded = ''
  let sourceText = 'CQ CQ DE K'
  let hideText = false
  let unbindKeyer = null

  const keyer = createKeyer({
    onElement(_el, pattern) {
      const live = root.querySelector('[data-live]')
      if (live) live.textContent = prettyPattern(pattern)
    },
    onChar(ch) {
      decoded += ch ?? '?'
      const out = root.querySelector('[data-decoded]')
      const live = root.querySelector('[data-live]')
      if (out) out.textContent = decoded
      if (live) live.textContent = ''
    },
    onWord() {
      if (!decoded.endsWith(' ')) decoded += ' '
      const out = root.querySelector('[data-decoded]')
      if (out) out.textContent = decoded
    },
  })

  function draw() {
    unbindKeyer?.()
    renderShell(root, {
      active: 'practice',
      title: 'Practice',
      subtitle: 'Free send and receive. Learn progress is untouched.',
      body: `
        <div class="flex gap-2 mb-4">
          <a href="#/practice/receive" class="${chip(tab === 'receive')}">Receive</a>
          <a href="#/practice/send" class="${chip(tab === 'send')}">Send</a>
        </div>
        ${tab === 'receive' ? receiveBody() : sendBody()}
      `,
    })
    if (tab === 'receive') bindReceive()
    else bindSend()
  }

  function receiveBody() {
    return `
      <div class="flex items-center justify-between gap-3">
        <label class="text-sm text-zinc-400">Text to play</label>
        <button data-hide type="button" class="text-sm text-lime-400">${hideText ? 'Show text' : 'Hide text'}</button>
      </div>
      <textarea data-text rows="3" ${hideText ? 'readonly' : ''} class="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 font-mono tracking-wide">${hideText ? maskText(sourceText) : sourceText}</textarea>
      <div class="flex flex-wrap gap-2 mt-3 text-sm">
        <button data-pool="letters" class="${chip(poolKind === 'letters')}">Letters</button>
        <button data-pool="digits" class="${chip(poolKind === 'digits')}">Numbers</button>
        <button data-pool="punct" class="${chip(poolKind === 'punct')}">Punctuation</button>
        <button data-random class="rounded-full px-3 py-1 bg-zinc-800">Random group</button>
      </div>
      <div class="flex gap-2 mt-4">
        <button data-play class="flex-1 rounded-md bg-lime-400 py-3 font-semibold text-zinc-950">Play</button>
        <button data-stop class="flex-1 rounded-md border border-zinc-700 py-3">Stop</button>
      </div>
      <label class="block text-sm text-zinc-400 mt-5">What you heard</label>
      <input data-answer class="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-3 uppercase" />
      <button data-check class="mt-3 w-full rounded-md border border-zinc-700 py-3">Check</button>
      <p data-result class="mt-3 text-sm min-h-6"></p>
    `
  }

  function sendBody() {
    return `
      <p class="text-sm text-zinc-400 mb-2">Key anything. It decodes into the pad below.</p>
      <p data-decoded class="min-h-16 rounded-md bg-zinc-900 border border-zinc-800 p-3 font-mono tracking-wide">${decoded || ' '}</p>
      <p data-live class="text-center text-lime-300 tracking-[0.4em] min-h-6 my-2"></p>
      <div class="mb-3">${straightKeyMarkup()}</div>
      ${paddlesMarkup()}
      <button data-clear class="mt-3 w-full rounded-md border border-zinc-700 py-3">Clear</button>
    `
  }

  function bindReceive() {
    const area = root.querySelector('[data-text]')
    const result = root.querySelector('[data-result]')
    const answer = root.querySelector('[data-answer]')
    function showSource() {
      area.value = hideText ? maskText(sourceText) : sourceText
      area.readOnly = hideText
      const hideBtn = root.querySelector('[data-hide]')
      if (hideBtn) hideBtn.textContent = hideText ? 'Show text' : 'Hide text'
    }

    area.addEventListener('input', () => {
      if (!hideText) sourceText = area.value
    })

    root.querySelector('[data-hide]').onclick = () => {
      if (!hideText) sourceText = area.value
      hideText = !hideText
      showSource()
    }

    root.querySelector('[data-play]').onclick = async () => {
      if (!hideText) sourceText = area.value
      result.textContent = 'Playing…'
      try {
        await unlockAudio()
        await playText(sourceText)
        result.textContent = 'Done'
      } catch {
        result.textContent = 'Stopped'
      }
    }
    root.querySelector('[data-stop]').onclick = () => {
      stopPlay()
      result.textContent = 'Stopped'
    }
    root.querySelector('[data-random]').onclick = () => {
      const size = getSettings().groupSize
      sourceText = Array.from({ length: size }, () => pool[Math.floor(Math.random() * pool.length)]).join('')
      showSource()
    }
    root.querySelectorAll('[data-pool]').forEach((btn) => {
      btn.onclick = () => {
        const kind = btn.dataset.pool
        poolKind = kind
        if (kind === 'letters') pool = [...LETTERS]
        if (kind === 'digits') pool = [...DIGITS]
        if (kind === 'punct') pool = [...PUNCT]
        root.querySelectorAll('[data-pool]').forEach((b) => {
          b.className = chip(b.dataset.pool === poolKind)
        })
      }
    })
    root.querySelector('[data-check]').onclick = () => {
      if (!hideText) sourceText = area.value
      const want = sourceText.toUpperCase().replace(/\s+/g, '')
      const got = answer.value.toUpperCase().replace(/\s+/g, '')
      result.textContent = want === got ? 'Match' : `Heard as ${got || '—'} · sent ${want || '—'}`
      result.className = `mt-3 text-sm min-h-6 ${want === got ? 'text-emerald-400' : 'text-red-400'}`
    }
  }

  function bindSend() {
    unbindKeyer = bindKeyerControls(root, keyer)
    root.querySelector('[data-clear]').onclick = () => {
      decoded = ''
      keyer.reset()
      draw()
    }
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

function maskText(text) {
  return [...String(text)].map((ch) => (ch === ' ' || ch === '\n' ? ch : '*')).join('')
}
