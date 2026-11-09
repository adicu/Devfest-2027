# DevFest 2027 - homepage

Plain HTML/CSS/JS, no build step. Open `index.html` in a browser, or serve with `python3 -m http.server`.

## How it works
- **Hero** (`.hero`) is 240vh tall with a sticky 100vh viewport inside it. `script.js` turns scroll position into a CSS variable `--p` (0 = day, 1 = sunset).
- `--p` drives: the sunset skyline's opacity, the sunset sky fill (portrait), the blimp's horizontal position, and the scroll hint fading out.
- **Skyline art** is 16:9 (`skyline-day-wide.jpg` / `skyline-sunset-wide.jpg`, 3840x2160). **`.stage`** is sized and placed exactly like the displayed image; the variables that do it (`--art-w/-h/-left/-top`) are on `.stage` in `styles.css`. `.hero__sticky` is a CSS size container, so `cqw/cqh` = the visible window (no desktop scrollbar; `100dvh` on mobile).
  - **Landscape** (window wider than tall): the image **covers** the window, centered. No gaps, no blur. Squarer windows lose a bit of the outer left/right edges; the labeled buildings are at 22-74% of the width, so they stay visible down to 1:1 (1280x1024 shows 14.8%-85.2%).
  - Ultrawide windows lose sky and water, centered, but the crop is clamped so the labeled buildings stay fully visible: at most `--crop-top-max: 0.163` from the top (Tracks roof at 16.6%) and keep at least `--keep-bottom: 0.915` (building hotspots end at 91.1%). That works up to about 2.37:1 (21:9, e.g. 2560x1080). The antenna (tip at 5.7%) is cropped on screens wider than about 1.9:1.
  - **Portrait** (`@container (aspect-ratio < 1)`): covering would cut off most buildings, so the image fits the full width, anchored to the bottom, and `.sky--day/--sunset` fill the space above with the art's own top-edge colors (sampled left/middle/right).
- **Hotspots, boat and blimp live inside `.stage`** and are positioned in `%` of the art, so they always line up with the drawing. Hotspot positions (left/top/width/height) are in `styles.css`. Schedule overlaps About and comes later in the HTML, so it's on top. The hover tag shows inside the bottom of each building, so it's never cropped.
- Buildings -> `#about`, `#tracks`, `#schedule`, `#judges`, `#faq`. Boat -> `#sponsors`.
- **Blimp** (`--bw`, `--blimp-top` on `.stage`): 39% of the art wide, but at least 580px (so the two-line countdown fits at full size) and never wider than the window. On phones (under 600px wide) it's 85% of the screen (at least 320px). It flies from the center of the art (x 51%, just right of the Tracks tower) to the window's left edge as you scroll; the start is pulled left if the blimp would stick out past the window's right edge, so it's never cut off. Landscape: in the art's sky, 3% from the top (or just below the window's top when the sky is cropped), above the labeled buildings. Portrait: in the sky above the art, its bottom above the antenna tip. On ultrawide screens (sky cropped) it passes over the top of the Tracks tower mid-scroll, above the "TRACKS" lettering.
- **Countdown on the blimp** (`script.js`, "Blimp countdown"): counts down to **2027-02-06T09:00:00-05:00** (Feb 6, 2027, 9:00 AM New York time), an exact moment, so it's right in every time zone. The banner shows "Feb 6, 2027" on top (`clamp(18px, 3.1cqw, 28px)`) and "89 days 04 hrs 12 min" below (`clamp(28px, 4.9cqw, 46px)`), bold, in the ink color. On a phone-size blimp (under 580px wide) it switches to one line, "89d 04h 12m" (`clamp(18px, 8.2cqw, 34px)`). `.blimp` is a size container, so `cqw` = % of the blimp's width and the text always fits the cream banner. It updates just after every whole second, so the minute ticks over on time. From the start it shows "Happening now!", and from Feb 9 (after Feb 8) "Thanks for coming!". The visible text is `aria-hidden`; a visually hidden `aria-live="polite"` element (`.countdown-live`) says the same in words and only changes once a minute.
- **Boat** (`--boat-w`, `--bdrift` on `.stage`; links to `#sponsors`): `clamp(140px, 14vw, 300px)` wide (vw = window), capped at 4.6x the visible water strip so the waterline always reaches at least halfway up the hull (only matters on ultrawide screens: about 219px at 2560x1080, where just a 48px strip of water shows). Phones (under 600px wide): 28% of the screen. Everything is measured against the visible window, not the (possibly cropped) art:
  - bottom: just above the window's bottom edge (or 1% up from the art's bottom when that's visible). The hull is 59-92% down the image; the bob (4% down) and rock stay inside the image's transparent bottom margin, so the boat is never cut off.
  - left: 6% of the window, pulled left if the hull's tip (plus drift) would reach the Schedule hotspot, but never so far that the drift or hover pushes it off the left edge. On phones that means ~2% from the left with a small drift (2% of its width instead of 8%).
  - Three loops with unrelated durations: `boat-drift` (side to side, 13.7s), `boat-bob` (up/down, 3.3s), `boat-rock` (tilt, 5.1s). Hover: grows and tilts.
  - Only the drawn boat is clickable (the img has a `clip-path` traced from the art and the link itself has `pointer-events: none`), so the image's transparent corners never block a building hotspot behind it.
- **Sponsors** (`#sponsors`) is the underwater section: `sea.jpg` (the sea painting stacked twice), 7 fish, resting bubbles and the sponsor tiers (`.tier--gold/silver/bronze`).
  - **Layout**: the fish swim in the top 64vw; the heading and logos follow in normal flow (`padding-top: 64vw`), and the section grows to fit them (`min-height: 112.7vw`, the Figma frame). Logo widths: gold `clamp(180px, 24vw, 420px)` (on phones under 600px: at least 60% of the screen), silver `clamp(130px, 16vw, 300px)`, bronze `clamp(90px, 11vw, 200px)`. Several logos in a tier wrap onto centered rows. Heading `clamp(2.8rem, 7vw, 6rem)`.
  - **Fish** (`.fish` wrapper + `img`): the wrapper crosses at a steady, linear speed (10-22s, `--t`), entering off one side and leaving off the other. The img does a long smooth wave (3vw tall, one full wave = 2 x `--wh` = 4-8s, ease-in-out), tilts nose-up while rising and nose-down while falling (in sync with the wave, a quarter-wave behind so the tilt peaks when it moves fastest), and has a tiny 0.6s horizontal squash/stretch for a tail-beat feel. Everything is transform-only. Settings are inline CSS vars in `index.html` (`--y`, `--w`, `--t`, `--delay`, `--wh`, `--wd`, `--flip`, `--x`). The art faces LEFT for fish-1/4/5/6 and RIGHT for fish-2/7/8; `--flip:-1` mirrors a fish swimming the other way. Fish stay above the heading.
  - **Resting bubbles**: 47, in `BUBBLES` in `script.js` as `[x, y, size]` in vw on the Figma frame (the original 17 plus 30 in overlapping "streams"). `layoutBubbles()` stretches the part below the heading (y > 64) to the section's real height, then pushes any bubble that could touch the heading or a logo (including its bob and scroll drift) sideways, so the middle stays clear. See-through (opacity 0.75-0.85), small ones in front of big ones (z-index), they float up a little and bob, drift with scroll (parallax, only while the section is on screen), and pop on click. They live in `.bubbles` (z-index 1) under `.sponsors` (z-index 2), so the heading and logos are on top and clickable.
  - **"Bubble up, then clear" transition** (`.sea[data-phase]`, `script.js`):
    1. `armed`: resting bubbles and sponsors hidden.
    2. When ~30% of the section is on screen (capped at 60% of the window, since this section can be taller than the screen), `burst`: 40-60 temporary `.burst-bubble`s (2-25vw; scaled up on tall phone screens so they still fill it) rise from below the visible part, staggered over ~0.3s, with a sideways wobble, overlapping, so at the peak (~0.8s) ~85-95% of the visible section is covered, logos included. They are above everything (z-index 4) but `pointer-events: none`. Animated with the Web Animations API, transform + opacity only.
    3. They keep rising out the top and fade (about 30% pop like a click) and are removed. Any one spot (e.g. a logo) is covered for under ~1s.
    4. At 0.95s, `settled`: resting bubbles pop in with a little bounce (staggered) and the heading + logos fade/scale up. Everything is clear by ~2s.
    5. When the section fully leaves the screen it resets to `armed`, so the burst replays next time.
  - `.sea` has `overflow: hidden`, so off-screen fish and bubbles never cause sideways scrolling.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no bubble burst (no `data-phase`, the final layout is shown), no swimming, bobbing, drifting or parallax; fish rest at their `--x` spots. The countdown still updates.
- **Footer**: just "DevFest 2027".

## Assets (`assets/`)
| File | What |
|---|---|
| `skyline-day-wide.jpg` | day skyline, 16:9 (3840x2160) - used by the hero |
| `skyline-sunset-wide.jpg` | sunset skyline, same framing - used by the hero |
| `skyline-day.jpg`, `skyline-sunset.jpg` | old 4800:3605 skylines, no longer used (safe to delete) |
| `boat-sponsors.png` | transparent sponsors boat |
| `blimp-banner.png` | transparent blimp + blank banner (text is HTML: `.blimp__text`) |
| `sea.jpg` | sea background, stacked twice (2nd copy mirrored) |
| `fish-1,2,4..8.png` | individual fish (directly in `assets/`; there is no fish-3) |
| `bubble.png` | bubble |
| `sponsor-placeholder.png` | placeholder logo, replace per sponsor |

## TODO
- [ ] Fill in real content for each section (currently placeholders)
- [ ] Apply link (`.btn` in About)
- [ ] Sponsor logos (replace `sponsor-placeholder.png` in each tier)
- [ ] Deploy (GitHub Pages: Settings -> Pages -> deploy from `main` / root)
- [ ] If you redraw/reframe the skyline, re-measure the hotspot `%` positions
