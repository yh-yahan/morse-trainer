import './style.css'
import { renderHome } from './views/home.js'
import { renderLearn } from './views/learn.js'
import { renderPractice } from './views/practice.js'
import { renderSettings } from './views/settings.js'
import { renderChart } from './views/chart.js'

const app = document.getElementById('app')
let cleanup = null

const routes = {
  '': renderHome,
  '#/': renderHome,
  '#/learn': renderLearn,
  '#/practice': renderPractice,
  '#/practice/receive': renderPractice,
  '#/practice/send': renderPractice,
  '#/settings': renderSettings,
  '#/chart': renderChart,
}

function route() {
  cleanup?.()
  const hash = window.location.hash || '#/'
  const view = routes[hash] || renderHome
  cleanup = view(app) || null
}

window.addEventListener('hashchange', route)
route()
