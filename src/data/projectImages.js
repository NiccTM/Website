/**
 * Card hero images and section order for the projects grid.
 *
 * This lives apart from ProjectGallery.jsx, which renders it, because
 * scripts/prerender-meta.mjs also needs it: /projects' LCP element is the first
 * card's image, and the shell preloads it. Node cannot import a .jsx file, and
 * duplicating the mapping in the build script would let the preload drift onto
 * the wrong image the moment a project is reordered -- which would be worse
 * than no preload at all, because it would fetch a second image at high
 * priority AND still discover the real one late.
 */

// ─── Card-level hero images keyed by project id ───────────────────────────────
export const PROJECT_IMAGES = {
  'bldc-motor':       '/motor-proto.jpg',
  'water-contact':    '/Water_Sense_AerospaceTeam_PCB.jpg',
  ecosort:            '/20260321_210541.jpg',
  'feeble-presence':  '/Water wavy August 9.jpg',
  'delorean-apsc171': '/DeLorean.png',
  unbox:              '/UnBox.jpg',
  firesense:          '/FireSense.jpg',
  consultation:       '/Remastered Photos/Canadian Parliament Building 1.jpg',
  whistler:           '/Remastered Photos/Kelowna Mountains.jpg',
  // Software dashboards -- 16:10 hero crops of a real app screen.
  algotraderos:       '/project-heroes/algotraderos.png',
  tracesight:         '/project-heroes/tracesight.png',
  signalvault:        '/project-heroes/signalvault.png',
  rigpilot:           '/project-heroes/rigpilot.png',
}

export const SECTIONS = [
  { key: 'competitive', label: 'Competitive Design',    icon: 'emoji_events' },
  { key: 'practice',    label: 'Professional Practice', icon: 'gavel' },
  { key: 'software',    label: 'Software & Personal',   icon: 'code' },
]

/**
 * The image ProjectCard renders for a project: its keyed hero, else the first
 * image of the first sub-system in its expanded details, else nothing.
 * Mirrors ProjectCard's own `displayImage`, and is used by it.
 */
export const projectCardImage = (project) =>
  PROJECT_IMAGES[project.id] ||
  project.expandedDetails?.subSystems?.flatMap((s) => s.images)?.[0]?.src ||
  null

/**
 * The image the LCP element on /projects will be: the first card of the first
 * non-empty section. Returns null when that card has no photograph, in which
 * case there is nothing to preload.
 */
export function firstProjectImage(projects) {
  for (const section of SECTIONS) {
    const inSection = projects.filter((p) => p.category === section.key)
    if (inSection.length) return projectCardImage(inSection[0])
  }
  return null
}
