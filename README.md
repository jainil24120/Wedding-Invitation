# Chhaya & Kushal — The Royal Wedding Film Experience

Pure HTML, CSS and vanilla JavaScript. No build step. GSAP 3.12.5, ScrollTrigger and Lenis 1.1.13 load from CDN.

## Run locally

Any static server works, for example:

```
python -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly from disk also works, but video and calendar downloads behave more reliably over http.)

## Structure

```
index.html            All wedding content (edit wording here)
css/style.css         Palette tokens, typography, every section (mobile first)
css/responsive.css    Tablet, desktop, wide and phone-landscape layouts
css/animations.css    Keyframes, no-GSAP fallback, reduced-motion rules
js/main.js            SITE config (music, countdown, sharing), Lenis + GSAP setup
js/animations.js      Gate opening, chapter arch reveals, scroll scenes, embers
js/countdown.js       Live countdown to 2 Dec 2026, 8:00 PM IST
js/interactions.js    Music, calendar (.ics + Google), Maps, share, rail, video
assets/images         Scene images (WebP) + og-share.jpg
assets/textures       Sandstone + brocade textures
assets/video          clip-a.mp4 (countdown arch), clip-b.mp4 (reception arch)
assets/music          Put the client's audio file here
```

## Configuration (js/main.js)

| Setting | Purpose |
|---|---|
| `musicSrc` | Path to the music file, e.g. `assets/music/wedding-theme.mp3`. Empty = control hidden. |
| `musicVolume` | Fade-in target volume (0–1). |
| `countdownTarget` | `2026-12-02T20:00:00+05:30` |
| `shareTitle` / `shareUrl` | Text and URL used by Share / WhatsApp / Copy Link. |

After deploying, change `og:image` in `index.html` to an absolute URL (e.g. `https://your-domain/assets/images/og-share.jpg`) so WhatsApp shows the preview image.

## Editing content

All client wording lives in `index.html`. The website credit (Jainil Jain · 7227885544 · zodiactechlance.com) is the `<footer class="credit">` at the end of the page. Event calendar data is on each `.actions` element (`data-cal-title`, `data-cal-start`, `data-cal-location`, `data-cal-details`). Maps links are built from each link's `data-maps` address.

## Asset mapping

| File | Section |
|---|---|
| gate-doors-desktop / -mobile | Opening gates (split into two leaves) |
| courtyard-reveal-desktop / -mobile | Behind the gates + hero |
| ch1-courtyard-wide | Chapter 01 backdrop |
| mandap-detail | Chapter 01 arched image |
| ch2-palace-hall | Chapter 02 backdrop |
| jharokha-facade | Chapter 02 "With Best Compliments" |
| om-symbol-gold | Chapter 02 (converted to transparent; Unicode ॐ fallback) |
| ch3-palace-corridor | Chapter 03 backdrop |
| lantern-brass | Parallax lanterns, Chapter 03 + closing (transparent) |
| closing-palace-night | Closing scene |
| fabric-maroon-terracotta | Brocade wall around the chapter arches |
| sandstone-texture | Invitee plaque |
| clip-b.mp4 | Chapter 02 moving arch window |
| clip-a.mp4 | Countdown arch. **Only the upper part is shown**: the clip contains a bride and groom lower in the frame, which the brief excludes. |

Both videos are colour-graded in CSS to sit in the maroon / terracotta palette.

**Licensing:** the two clips were downloaded from Pinterest (via Klickpin). Confirm you have the right to use them on a client site, or replace them with licensed footage using the same filenames.

## Behaviour notes

- **Calendar:** events use `TZID=Asia/Kolkata` with no invented end time. Wed Lock is a single event at 5:30 pm; "5:30 pm & Dinner onwards 8:00 pm" is in its description.
- **Residence (Mehandi):** no map link, because no address was supplied.
- **Reception:** no date, time or venue shown, because none was supplied.
- **Music:** starts only when the gates are opened, fades in and loops. It pauses when the tab is hidden and resumes only if it was playing, never after a manual pause. The **M** key toggles it.
- **Reduced motion:** no Lenis, no scroll scenes, no embers, no video autoplay; the gates simply fade.
- **Without GSAP/Lenis (CDN failure):** all content stays visible, and the gates open with CSS transitions.
- **Low-power devices:** fewer embers; chapter arch clip animation is skipped.

## QA checklist

- [ ] Real iPhone (Safari) and Android (Chrome) via a WhatsApp link: gates open on tap, scrolling feels native
- [ ] Music: add the file, check fade-in, pause/resume, tab switch, manual pause stays paused
- [ ] Calendar: Google link and .ics on iOS, Android, desktop (Outlook / Apple Calendar)
- [ ] Maps links open the correct venues
- [ ] Countdown reads correctly; temporarily set `countdownTarget` to a past date to see "The celebrations have begun"
- [ ] Reduced motion enabled at OS level
- [ ] Widths 320, 360, 390, 430, 667×375, 768, 1024, 1440, 1920
- [ ] WhatsApp link preview after og:image is made absolute
