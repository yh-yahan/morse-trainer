import { renderShell } from '../ui/shell.js'
import { currentSet, nextLetter, recentStats } from '../app/koch.js'

export function renderHome(root) {
  const set = currentSet()
  const next = nextLetter()
  const stats = recentStats()
  const acc = stats.total ? Math.round(stats.accuracy * 100) : 0

  renderShell(root, {
    active: 'home',
    title: 'Trainer',
    subtitle: 'Learn with Koch, or send and receive freely.',
    body: `
      <div class="grid gap-3">
        <a href="#/learn" class="rounded-lg bg-zinc-900 border border-zinc-800 p-5">
          <p class="text-xs uppercase tracking-widest text-lime-400">Learn</p>
          <p class="text-xl font-semibold mt-1">Koch path</p>
          <p class="text-sm text-zinc-400 mt-2">Unlocked ${set.join(' ')}</p>
          <p class="text-sm text-zinc-500 mt-1">${next ? `Next letter ${next}` : 'Set complete'} · ${acc}% of last ${stats.total}</p>
        </a>
        <a href="#/practice" class="rounded-lg bg-zinc-900 border border-zinc-800 p-5">
          <p class="text-xs uppercase tracking-widest text-lime-400">Practice</p>
          <p class="text-xl font-semibold mt-1">Send & receive</p>
          <p class="text-sm text-zinc-400 mt-2">Free play. Does not change learning progress.</p>
        </a>
        <div class="grid grid-cols-2 gap-3">
          <a href="#/chart" class="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm">Reference chart</a>
          <a href="#/settings" class="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm">Speed & pitch</a>
        </div>
      </div>
    `,
  })
}
