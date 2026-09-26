import { renderShell } from '../ui/shell.js'
import { MORSE, prettyPattern } from '../app/morse.js'
import { playText, unlockAudio } from '../app/audio.js'
import { currentSet } from '../app/koch.js'

export function renderChart(root) {
  const unlocked = new Set(currentSet())
  const chars = Object.keys(MORSE)

  renderShell(root, {
    active: 'home',
    title: 'Chart',
    subtitle: 'Tap a character to hear it.',
    body: `
      <div class="grid grid-cols-4 gap-2">
        ${chars
          .map((ch) => {
            const on = unlocked.has(ch)
            return `
              <button data-ch="${ch}" class="rounded-md border ${on ? 'border-lime-400/40 bg-zinc-900' : 'border-zinc-800 bg-zinc-950'} p-3 text-left">
                <span class="block text-lg font-semibold">${ch}</span>
                <span class="block text-xs text-lime-300 tracking-widest">${prettyPattern(MORSE[ch])}</span>
              </button>
            `
          })
          .join('')}
      </div>
    `,
  })

  root.querySelectorAll('[data-ch]').forEach((btn) => {
    btn.onclick = async () => {
      await unlockAudio()
      await playText(btn.dataset.ch)
    }
  })
}
