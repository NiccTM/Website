/**
 * Drop-in replacement for a grid-tile <img> that offers AVIF first.
 *
 * Takes exactly the props an <img> takes, including an ALREADY-THUMBED src:
 *
 *     <Picture src={thumbSrc(photo.src)} alt="..." loading="lazy" />
 *
 * so converting a call site is a one-word change and every existing className,
 * style, ref and handler keeps working.
 *
 * WHY A MANIFEST IS NOT NEEDED
 * A <source> whose file 404s does NOT fall back to the <img> -- the browser has
 * already committed to that source and renders a broken image. So the AVIF may
 * only be offered when it is certain to exist.
 *
 * It is certain exactly when the src is a /thumbs/ path ending in .jpg/.jpeg/
 * .png, because scripts/generate-avif.ps1 encodes every such file in every
 * thumbs/ folder under public/, and thumbSrc() only returns a /thumbs/ path for
 * images the thumbnail generator actually produced. Anything else -- an
 * external URL, a .gif, a display/ tier path, an un-thumbed original -- falls
 * through to a plain <img> untouched.
 *
 * WHY display: contents
 * Wrapping an <img> in a <picture> inserts a new element into the layout tree,
 * and these tiles are sized with h-full / object-cover against a parent box. A
 * default inline <picture> has auto height, so height:100% on the <img> would
 * resolve against nothing and collapse the tile. display: contents removes the
 * <picture> box from layout entirely, leaving the <img> to lay out against the
 * same parent it had before the wrapper existed.
 */
const THUMB_RASTER = /\/thumbs\/[^/]+\.(jpe?g|png)$/i

export default function Picture({ src, ...imgProps }) {
  const avif =
    typeof src === 'string' && THUMB_RASTER.test(src)
      ? src.replace(/\.(jpe?g|png)$/i, '.avif')
      : null

  if (!avif) return <img src={src} {...imgProps} />

  return (
    <picture style={{ display: 'contents' }}>
      <source type="image/avif" srcSet={encodeURI(avif)} />
      <img src={src} {...imgProps} />
    </picture>
  )
}
