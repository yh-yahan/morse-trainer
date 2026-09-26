import { renderShell } from '../ui/shell.js'
import { getSettings, setSettings, resetLearn, resetAll } from '../app/store.js'
import { applyAudioSettings, unlockAudio } from '../app/audio.js'
import { playText } from '../app/audio.js'

export function renderSettings(root) {
  draw()

  function draw() {
    const s = getSettings()
    renderShell(root, {
      active: 'settings',
      title: 'Settings',
      subtitle: 'Shared by Learn and Practice.',
      body: `
        ${slider('charWpm', 'Character speed', s.charWpm, 5, 35, 'WPM')}
        ${slider('effectiveWpm', 'Farnsworth (effective)', s.effectiveWpm, 5, 35, 'WPM')}
        ${slider('pitch', 'Pitch', s.pitch, 400, 900, 'Hz')}
        ${slider('volume', 'Volume', Math.round(s.volume * 100), 5, 100, '%')}
        ${slider('groupSize', 'Group size', s.groupSize, 1, 8, '')}
        <label class="mt-4 flex items-center justify-between rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
          <span>Swap paddles</span>
          <input data-toggle="paddleSwap" type="checkbox" ${s.paddleSwap ? 'checked' : ''} />
        </label>
        <label class="mt-2 flex items-center justify-between rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
          <span>Show Morse in Learn</span>
          <input data-toggle="showPattern" type="checkbox" ${s.showPattern ? 'checked' : ''} />
        </label>
        <button data-sample class="mt-5 w-full rounded-md bg-lime-400 py-3 font-semibold text-zinc-950">Play sample PARIS</button>
        <button data-reset-learn class="mt-3 w-full rounded-md border border-zinc-700 py-3">Reset Learn progress</button>
        <button data-reset-all class="mt-2 w-full rounded-md border border-red-900 text-red-300 py-3">Reset everything</button>
      `,
    })

    root.querySelectorAll('[data-key]').forEach((input) => {
      input.oninput = () => {
        const key = input.dataset.key
        const raw = Number(input.value)
        const value = key === 'volume' ? raw / 100 : raw
        setSettings({ [key]: value })
        applyAudioSettings()
        const label = input.parentElement.querySelector('[data-val]')
        if (label) label.textContent = format(key, key === 'volume' ? raw : value, key === 'volume' ? '%' : key === 'pitch' ? 'Hz' : key.includes('Wpm') ? 'WPM' : '')
        if (key === 'charWpm') {
          const s2 = getSettings()
          const other = root.querySelector('[data-key="effectiveWpm"]')
          if (other) {
            other.max = s2.charWpm
            if (Number(other.value) > s2.charWpm) other.value = s2.charWpm
          }
        }
      }
    })

    root.querySelectorAll('[data-toggle]').forEach((input) => {
      input.onchange = () => setSettings({ [input.dataset.toggle]: input.checked })
    })

    root.querySelector('[data-sample]').onclick = async () => {
      await unlockAudio()
      await playText('PARIS')
    }
    root.querySelector('[data-reset-learn]').onclick = () => {
      if (confirm('Reset Koch progress?')) resetLearn()
    }
    root.querySelector('[data-reset-all]').onclick = () => {
      if (confirm('Reset settings and progress?')) {
        resetAll()
        draw()
      }
    }
  }
}

function slider(key, label, value, min, max, unit) {
  return `
    <label class="block mb-4">
      <span class="flex justify-between text-sm text-zinc-300">
        <span>${label}</span>
        <span data-val>${format(key, value, unit)}</span>
      </span>
      <input data-key="${key}" type="range" min="${min}" max="${max}" value="${value}" class="w-full mt-2" />
    </label>
  `
}

function format(_key, value, unit = '') {
  return unit ? `${value} ${unit}` : String(value)
}
