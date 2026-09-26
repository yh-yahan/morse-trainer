import { getSettings } from '../app/store.js'

export function paddlesMarkup() {
  const swap = getSettings().paddleSwap
  const left = swap ? ['dah', 'Dah −'] : ['dit', 'Dit ·']
  const right = swap ? ['dit', 'Dit ·'] : ['dah', 'Dah −']
  return `
    <div class="grid grid-cols-2 gap-3">
      <button type="button" data-paddle="${left[0]}" class="paddle h-28 rounded-2xl bg-zinc-800 text-lg font-semibold active:bg-amber-400 active:text-zinc-950">
        ${left[1]}
      </button>
      <button type="button" data-paddle="${right[0]}" class="paddle h-28 rounded-2xl bg-zinc-800 text-lg font-semibold active:bg-amber-400 active:text-zinc-950">
        ${right[1]}
      </button>
    </div>
  `
}

export function straightKeyMarkup() {
  return `
    <button type="button" data-straight class="paddle h-28 w-full rounded-2xl bg-zinc-800 text-lg font-semibold active:bg-amber-400 active:text-zinc-950 data-[down=true]:bg-amber-400 data-[down=true]:text-zinc-950">
      Space or hold · short dit / long dah
    </button>
  `
}

export function bindKeyerControls(root, keyer) {
  const unbind = []
  const straight = root.querySelector('[data-straight]')
  if (straight) {
    unbind.push(keyer.attachStraight(straight))
    unbind.push(keyer.attachSpace(straight))
  }
  root.querySelectorAll('[data-paddle]').forEach((el) => {
    unbind.push(keyer.attachPaddle(el, el.dataset.paddle))
  })
  return () => unbind.forEach((fn) => fn())
}
