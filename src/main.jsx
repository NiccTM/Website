import React from 'react'
import ReactDOM from 'react-dom/client'
import { inject } from '@vercel/analytics'
import App from './App'
import './styles/index.css'

inject()

/* hydrateRoot, not createRoot. The shells now ship the route already rendered
   (see scripts/prerender-meta.mjs), and createRoot would throw that markup away
   and rebuild the DOM from scratch -- which shows up as a visible flash and
   gives back exactly the paint the prerender was there to buy.
   The `root` div is empty in dev, where index.html is served unprocessed;
   hydrating an empty container is what createRoot does anyway, so one path
   works for both. */
const container = document.getElementById('root')
const tree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, tree)
} else {
  ReactDOM.createRoot(container).render(tree)
}
