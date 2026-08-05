# Getting the URL in front of people

Ready-to-paste copy. Every claim here comes from the site itself
(`src/data/config.js` and the route content) — nothing is invented, so you can
paste it without fact-checking me. Change the voice freely; just keep it true.

The site is fast and accessible now. It gets **7 visits a week**. That is the
actual bottleneck, and none of it is fixable in code.

---

## 1. GitHub profile README

GitHub renders `README.md` from a repo named after your username on your
profile page. You do not have one yet.

**Create the repo `NiccTM/NiccTM`** (public, tick "Add a README"), then paste
this in. GitHub shows it at the top of <https://github.com/NiccTM>.

```markdown
## Nic Piraino

Electrical Engineering at UBC Okanagan (BASc + Master of Management, expected
April 2029). Hardware Engineering Intern at Measurements International, a
precision electrical metrology company. Okanagan Rover Craft, and a CIRC
competitor. EGBC student member since 2023.

I care about the distinction between calculated, simulated and measured —
they are three different claims, and treating them as interchangeable is how a
design ends up sounding better than it is.

**Work → [nicpiraino.com](https://nicpiraino.com)**

- **[Hardware](https://nicpiraino.com/hardware)** — an Altium PCB you can orbit
  in 3D, a three-phase BLDC motor wound from scratch, and a water-contact
  sensor built for a UAS
- **[Voltage reference](https://nicpiraino.com/hardware/reference)** — a 10 V
  buried-Zener reference, with the test data
- **[Projects](https://nicpiraino.com/projects)** — competition hardware,
  coursework that outgrew the assignment, and the software around it
- **[Colophon](https://nicpiraino.com/colophon)** — how the site is built,
  including the things I got wrong and had to fix

Kelowna, BC · nic.piraino2005@gmail.com
```

**Why this shape:** a recruiter skimming GitHub sees the role, the school, the
timeline and a link, in that order, without scrolling. The colophon link is
deliberate — a page that lists your own mistakes is the least fakeable thing on
the site and it is a genuine differentiator for an engineering hire.

---

## 2. LinkedIn

### Headline (220 char limit)

```
Electrical Engineering @ UBC Okanagan · Hardware Engineering Intern at Measurements International · PCB design, embedded C, motor control · nicpiraino.com
```

### Featured section

Add the site as a Featured link. This is the single highest-value change on
LinkedIn: Featured items appear above the fold with a preview image, and your
Open Graph tags and preview image are already correct on every route, so the
card will render properly.

Link `https://nicpiraino.com/hardware` rather than the home page — it is the
page that shows engineering work fastest.

### About section

```
Electrical Engineering at UBC Okanagan, BASc plus a Master of Management,
expected April 2029. Currently a Hardware Engineering Intern at Measurements
International, a precision electrical metrology company, where my first term
was largely documentation and configuration control: modernising older
schematics, producing revised board versions to match existing hardware, and
generating BOMs, change logs and assembly instructions.

A schematic predicts how a circuit should behave, a simulation models it, and a
datasheet defines what a part is supposed to do. The interesting part starts
once the hardware exists and has to demonstrate what it actually does — so I am
sceptical of designing by nominal value alone. Resistors have temperature and
voltage coefficients, amplifiers have offset and drift, copper has resistance,
and temperature moves nearly everything.

Recent work: a three-phase BLDC motor wound from scratch, where the fix was
replacing PLA stator teeth with iron bolts and rewinding for a different
commutation sequence. A water-contact sensor for a UAS with the aerospace team.
A 10 V buried-Zener voltage reference. Okanagan Rover Craft and CIRC.

Portfolio, with the measurements: https://nicpiraino.com
```

---

## 3. Email signature

```
Nic Piraino
Electrical Engineering · UBC Okanagan
nicpiraino.com · nic.piraino2005@gmail.com
```

Keep it to three lines. A signature longer than the shortest email you send
reads as a business card, not a person.

---

## 4. Where the link actually earns its keep

In rough order of return:

1. **Every application.** In the résumé header, next to your email — not buried
   in a "links" section at the bottom. Recruiters skim the top third.
2. **LinkedIn Featured**, as above.
3. **GitHub profile README**, as above.
4. **Pinned repos.** Pin the repositories behind the projects the site shows,
   and put the matching `nicpiraino.com/...` link in each repo's About field.
   Someone who lands on the code should be one click from the write-up.
5. **Email signature** — every message to a professor, a recruiter, or a team.
6. **UBCO / Rover / CIRC** team pages and Discords, wherever member links exist.

---

## 5. The one thing still missing

**A résumé PDF.** It is the first thing a recruiter looks for and there is
nowhere on the site to get one. Everything above sends people to a site that
cannot give them the document they came for.

Host it at `/nic-piraino-resume.pdf` (drop the file in `public/`) and link it
from the home page and `/about`. Say the word and I will wire up the link and
the download button once you have the file.
