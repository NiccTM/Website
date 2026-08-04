/**
 * Column classes for a tile grid, capped to the number of tiles it holds.
 *
 * The hardware sections on /hobbies each opened a four- or five-column grid no
 * matter how many photos they contained, so the categories holding a single
 * photo -- headphones, the DVD player, the workbench -- put one tile on a row
 * and left three-quarters of it empty. Several of those stacked down the page
 * read as a grid that failed to fill rather than as a deliberate layout.
 *
 * Capping the column count alone is not enough: at grid-cols-1 a lone tile
 * stretches the full row width and turns a 4:3 photo into a banner. So the width
 * is capped with it. The caps are deliberately wider than the tile would have
 * been in a four-column track, which is what makes a one-photo section read as
 * a feature image instead of a stranded thumbnail -- capping at the original
 * ~20rem tile width was tried first and changed nothing visible.
 *
 * Class strings are written out in full because Tailwind's scanner reads source
 * text; a class name built from a template literal never reaches the CSS.
 *
 * Callers pass their own fallback so each grid keeps the ladder it already had
 * for the counts this does not cover.
 */
const GRID_FOR_COUNT = {
  1: 'grid-cols-1 max-w-[34rem]',
  2: 'grid-cols-1 min-[480px]:grid-cols-2 max-w-[52rem]',
  3: 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 max-w-[68rem]',
}

export const gridColsFor = (count, fallback) => GRID_FOR_COUNT[count] ?? fallback
