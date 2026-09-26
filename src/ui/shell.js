export function renderShell(root, { title, subtitle = '', active, body }) {
  root.innerHTML = `
    <div class="min-h-dvh flex flex-col">
      <header class="px-4 pt-5 pb-3 max-w-lg mx-auto w-full">
        <p class="text-xs uppercase tracking-[0.2em] text-lime-400/80">Morse</p>
        <h1 class="text-2xl font-semibold">${title}</h1>
        ${subtitle ? `<p data-subtitle class="text-sm text-zinc-400 mt-1">${subtitle}</p>` : ''}
      </header>
      <main class="flex-1 px-4 pb-28 max-w-lg mx-auto w-full">${body}</main>
      <nav class="fixed bottom-0 inset-x-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div class="max-w-lg mx-auto grid grid-cols-4 text-center text-base">
          ${tab('#/', 'Home', 'home', active)}
          ${tab('#/learn', 'Learn', 'learn', active)}
          ${tab('#/practice', 'Practice', 'practice', active)}
          ${tab('#/settings', 'Settings', 'settings', active)}
        </div>
      </nav>
    </div>
  `
}

function tab(href, label, id, active) {
  const on = active === id
  return `
    <a href="${href}" class="py-3 ${on ? 'text-lime-400' : 'text-zinc-500'}">${label}</a>
  `
}

export function btnPrimary(label, extra = '') {
  return `inline-flex items-center justify-center rounded-md bg-lime-400 px-4 py-3 font-semibold text-zinc-950 ${extra}`
}

export function btnGhost(label, extra = '') {
  return `inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-3 text-zinc-100 ${extra}`
}
