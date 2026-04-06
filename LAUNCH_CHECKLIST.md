# Final Launch Sequence

## 0. Pre-Deploy Actions (Developer)

- [ ] **Add CV PDF** — place `NicPiraino_CV.pdf` in the `public/` directory. The Download CV button in the hero already points to `/NicPiraino_CV.pdf`.
- [ ] **Confirm email address** — verify `contact.email` in `src/data/config.js` is correct before going live. Currently set to `nicpiraino@proton.me`.
- [ ] **Confirm domain** — update the `<loc>` URLs in `public/sitemap.xml` and the `og:image` URL in `index.html` if your final domain differs from `nicpiraino.com`.

---

## 1. Physical Device Stress Test

- [ ] Open the live staging URL on a physical iOS device (iPhone).
- [ ] Verify the frosted glass containers render correctly (no solid gray boxes — Safari requires `-webkit-backdrop-filter`, which has been applied globally).
- [ ] Scroll through the homepage, projects, and hardware sections.
- [ ] Tap the PCB viewer **"Click to activate 3D viewer"** button. Verify the Canvas loads and rotates. Confirm the browser does not crash or force-reload (PCB model has no textures so memory pressure is low).
- [ ] Tap the **Download CV** button — verify it triggers a download (or opens the PDF in a new tab on iOS, which is expected behavior for `download` attribute).
- [ ] Test the **photography lightbox** — open a photo, pinch-to-zoom, swipe left/right. Confirm `onContextMenu` prevention works (long-press should not show "Save Image").
- [ ] Test light/dark mode toggle on mobile.

---

## 2. Production Performance Audits

- [ ] Run an **Incognito Chrome Lighthouse** audit on the production URL (target: >90 across all categories).
  - Performance note: the 3D canvas is click-to-activate, so it will not penalize FCP/LCP unless the user explicitly enables it.
  - If Performance score is low, check image sizes — the hero carousel loads full-resolution JPGs. Consider converting to WebP.
- [ ] Run **WebPageTest** (`webpagetest.org`) from a mobile preset to validate real-device loading times.
- [ ] Test the live URL in the **LinkedIn Post Inspector** (`https://www.linkedin.com/post-inspector/`). Verify the title, description, and `og:image` unfurl correctly (image should be the Kelowna Mountains photo).
- [ ] Test Open Graph tags with the **Facebook Sharing Debugger** (`developers.facebook.com/tools/debug/`).

---

## 3. DNS & Security Setup

- [ ] Point custom domain DNS records (A Record + CNAME for `www`) to your hosting provider (Vercel).
- [ ] Wait for SSL certificate provisioning to complete. Do **not** share the link until HTTPS is fully secured (`https://` shows in browser address bar with no warnings).
- [ ] Verify `Strict-Transport-Security` header is present on the live domain using `curl -I https://nicpiraino.com`.
- [ ] Verify `Content-Security-Policy` header is active — run the site through `https://securityheaders.com`.
- [ ] Confirm `robots.txt` is accessible at `https://nicpiraino.com/robots.txt`.
- [ ] Submit `sitemap.xml` to Google Search Console (`https://search.google.com/search-console`).

---

## 4. Cross-Browser Smoke Test

| Browser | Platform | Test |
|---------|----------|------|
| Safari 17+ | macOS | Frosted glass, lightbox, 3D canvas |
| Safari | iOS 16+ | All of the above + touch swipe |
| Chrome | Desktop | Lighthouse audit |
| Firefox | Desktop | Backdrop-filter fallback (Firefox 103+ supports it) |
| Edge | Desktop | Basic smoke test |

---

## 5. Post-Launch Monitoring

- [ ] Verify **Vercel Analytics** is receiving page view events (check the Vercel dashboard after 10–15 minutes of traffic).
- [ ] Set a **Google Search Console** crawl request after submitting sitemap.
- [ ] Monitor for any `Content-Security-Policy` violations in the browser console on the first visit from a fresh session.
