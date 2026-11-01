import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './styles.css'
import './layout.css'
import App from './App'

// Captures for the case study and the changelog (?capture=1, or the changelog demo) leave out prototype-only controls.
const capture = () => document.documentElement.classList.toggle('is-capture', /[?&](capture=1|demo=changelog)\b/.test(window.location.search + window.location.hash))
capture()
window.addEventListener('hashchange', capture)

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
