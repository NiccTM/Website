# Google Search Console — setup

I cannot do this part: it needs a Google login. Everything on the site's side
is verified and correct, so this is purely the click-through.

## What I checked, against the live site

| | |
|---|---|
| `robots.txt` | 200, `Allow: /`, no blanket disallow |
| Sitemap referenced from robots.txt | yes — `Sitemap: https://nicpiraino.com/sitemap.xml` |
| `sitemap.xml` | 200, 7 URLs |
| Every sitemap URL | all 200, canonical matches, no `noindex` |
| Routes missing from the sitemap | none |
| Structured data | JSON-LD `Person` with `sameAs` for GitHub, LinkedIn, Discogs |
| Crawler-visible text (no JS) | **now 1,320–5,778 chars per route** — was 0 |

That last row is the one that changed today. Until this afternoon every route
served an empty `<div id="root">`, so anything that does not execute JavaScript
saw nothing at all. Googlebot does render JS, but it renders on a delay and a
budget; giving it the text directly is strictly better, and Bing and the social
scrapers do not render at all.

## Steps

1. Go to <https://search.google.com/search-console> and sign in.
2. **Add property → URL prefix**, and enter `https://nicpiraino.com`.
   Choose URL prefix, not Domain. Domain needs a DNS TXT record at your
   registrar; URL prefix can verify through the HTML tag, which is faster.
3. Pick the **HTML tag** verification method. It gives you a line like:
   `<meta name="google-site-verification" content="SOME-TOKEN" />`
4. Send me the token and I will add it to `index.html` and deploy — it needs to
   be in the served HTML before you press Verify. Takes about two minutes.
   (The alternative is the HTML file method: download the file they give you,
   drop it in `public/`, and it deploys the same way.)
5. Press **Verify**.
6. **Sitemaps** in the left sidebar → enter `sitemap.xml` → Submit.
7. **URL Inspection** on `https://nicpiraino.com/` → **Request indexing**.
   Do the same for `/hardware` and `/projects`. This is the only way to prompt
   a first crawl rather than waiting for one.

## What to look at afterwards

Nothing useful appears for a few days.

- **Pages** — how many of the 7 are indexed. Anything under "Crawled, currently
  not indexed" is worth reading.
- **Performance** — the queries you actually appear for. For a name-based
  domain the goal is simple: searching "Nic Piraino" should return this site.
  If it does not after a couple of weeks, tell me and I will look at the
  structured data and the internal linking.

## While you are there

Bing has its own, it takes about a minute, and it can import everything
straight from Search Console once that is set up:
<https://www.bing.com/webmasters>. Worth doing — Bing does not render
JavaScript at all, so today's change matters more there than it does for
Google.
