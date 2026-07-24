// The `with { type: 'json' }` attribute is required by Node's ESM loader and
// accepted by Vite, which keeps this module importable by both the bundler and
// `node --test` -- without it the unit tests cannot load it at all.
import PHOTO_DIMS from '../data/photoDimensions.json' with { type: 'json' }

/**
 * Maps a full-resolution image URL under /public to its generated thumbnail by
 * inserting a "thumbs/" segment before the filename:
 *
 *   /ASUS_laptop.jpg                 ->  /thumbs/ASUS_laptop.jpg
 *   /Remastered Photos/Clouds.jpg    ->  /Remastered Photos/thumbs/Clouds.jpg
 *
 * Returns the ORIGINAL untouched when no thumbnail was generated for it. The
 * generator only handles .jpg/.jpeg/.png, so animated .gif and .svg assets have
 * no derivative -- rewriting those blindly points at a file that does not exist
 * and renders as a broken image. photoDimensions.json is the generator's own
 * output, so it is the authoritative list of what actually got built.
 *
 * Thumbnails are width-capped derivatives (see scripts/generate-thumbnails.ps1)
 * used for grid tiles; the original is what a lightbox loads at full size.
 */
export const hasThumb = (src) =>
  typeof src === 'string' && Object.prototype.hasOwnProperty.call(PHOTO_DIMS, src)

export const thumbSrc = (src) =>
  hasThumb(src) ? src.replace(/\/([^/]+)$/, '/thumbs/$1') : src

/**
 * 1920px tier, for images rendered full-bleed where an 800px thumbnail would
 * visibly soften: hero backdrops, large panels. The home page hero was loading
 * 4-19 MB originals as a background, which was the bulk of its page weight.
 */
export const displaySrc = (src) =>
  hasThumb(src) ? src.replace(/\/([^/]+)$/, '/display/$1') : src
