/* LAB is the default display mode; NIGHT is opt-in. The stored values are the
   same 'light' | 'dark' strings the site has always written, so a returning
   visitor keeps whatever they chose before the redesign. Anything else --
   nothing stored, storage blocked, a hand-edited value -- falls back to LAB. */
export const initialDarkMode = (stored) => stored === 'dark'
