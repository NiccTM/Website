import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keeps the document's title, description, canonical URL and social-preview
 * tags in sync with the active route, then restores the site defaults on
 * unmount so navigating back to "/" is clean.
 *
 * The og:* / twitter:* tags used to be static in index.html, so every subpage
 * shared on LinkedIn/Discord rendered the HOME page's title and description --
 * a link to /projects previewed as "Hardware Engineering & System Design".
 * Because this is a client-rendered SPA there is no per-route HTML to put them
 * in, so they are updated here instead. Crawlers that execute JS read the
 * updated values; ones that do not still get the sensible defaults baked into
 * index.html.
 */
const SITE = 'https://nicpiraino.com'
const DEFAULT_TITLE = 'Nic Piraino | Hardware Engineering & System Design'
const DEFAULT_DESC  = 'Nic Piraino: Hardware Engineering & System Design. Embedded systems, PCB design, audio electronics, and full-stack engineering.'

/** Sets an existing meta tag's content, creating the tag if it is absent. */
function setMeta(selector, attr, name, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function usePageMeta(title, description) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `Nic Piraino | ${title}` : DEFAULT_TITLE
    const desc      = description ?? DEFAULT_DESC
    // Canonical form: absolute, no query/hash, no trailing slash except root.
    const url       = SITE + (pathname === '/' ? '/' : pathname.replace(/\/+$/, ''))

    const apply = (t, d, u) => {
      document.title = t
      setMeta('meta[name="description"]',         'name',     'description',         d)
      setMeta('meta[property="og:title"]',        'property', 'og:title',            t)
      setMeta('meta[property="og:description"]',  'property', 'og:description',      d)
      setMeta('meta[property="og:url"]',          'property', 'og:url',              u)
      setMeta('meta[name="twitter:title"]',       'name',     'twitter:title',       t)
      setMeta('meta[name="twitter:description"]', 'name',     'twitter:description', d)
      setCanonical(u)
    }

    apply(fullTitle, desc, url)
    return () => apply(DEFAULT_TITLE, DEFAULT_DESC, SITE + '/')
  }, [title, description, pathname])
}
