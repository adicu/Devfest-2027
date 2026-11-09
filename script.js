// DevFest 2027 - scroll-driven day -> sunset
(() => {
  const root = document.documentElement;
  const hero = document.querySelector(".hero");

  // Give each building its hover tag text (read from the link text)
  document.querySelectorAll(".hotspot").forEach((a) => {
    a.dataset.label = a.textContent.trim();
  });

  let ticking = false;

  function update() {
    ticking = false;
    // 0 at the top of the page, 1 once the hero has fully scrolled
    const scrollable = hero.offsetHeight - window.innerHeight;
    const raw = scrollable > 0 ? window.scrollY / scrollable : 1;
    const p = Math.min(1, Math.max(0, raw));
    // ease so the sunset "blooms" instead of fading linearly
    const eased = p * p * (3 - 2 * p);
    root.style.setProperty("--p", eased.toFixed(4));
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }


  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sea = document.querySelector("#sponsors");
  const sponsorsBlock = sea && sea.querySelector(".sponsors");

  // ---------- Sponsors: resting bubbles ----------
  // [x, y, size] in vw (center of the bubble), on the Figma frame: 100vw x
  // 112.7vw with the "Sponsors" heading at 64vw. The section is now taller
  // (bigger logos), so y values below 64 stretch to fill it (see layoutBubbles).
  // Any bubble that would sit on the heading or a logo is pushed sideways.
  const FIGMA_H = 112.7;
  const HEADING_Y = 64;
  const BUBBLES = [
    // original 17, measured from the Figma frame (448px wide -> 100vw)
    [4.9, 4.9, 3.1], [43.8, 18.3, 6.7], [83, 10.7, 6.7], [21.4, 37.5, 11.2],
    [58, 34.8, 6.7], [96, 30.8, 14.7], [71, 53.1, 11.6], [4.5, 59.8, 22.3],
    [24.6, 65.8, 18.8], [91.5, 69.2, 23.2], [13.8, 79.7, 12.5], [74.6, 90.4, 13.8],
    [6.3, 96, 21.4], [32.1, 103.8, 26.8], [95, 102.7, 24.6], [8.9, 110.5, 17.9],
    [74.6, 109.4, 24.6],
    // streams: one bigger bubble with smaller ones trailing above it
    [10, 22, 8.5], [14.5, 17, 4.2], [12, 13, 2.4], [17, 25, 3],
    [64, 9, 9.5], [68.5, 5, 4], [60, 13, 3.2],
    [33, 52, 14], [38.5, 46, 5.5], [29, 45, 3], [36, 58, 2.6],
    [86, 44, 10.5], [81.5, 39, 4.5], [90, 37, 2.8],
    [47, 82, 28], [56, 72, 6],                       // big one behind the logos
    [20, 92, 9], [25, 87, 4.5], [16.5, 86.5, 3],
    [85, 83, 16], [80, 76, 5], [88.5, 74, 2.5],
    [55, 104, 20], [62, 97, 7], [60, 92, 3.2],
    [40, 29, 5], [43, 26, 2.2],
    // singles
    [2.5, 42, 6], [98, 55, 4], [28, 6, 5],
  ];
  const bubbleLayer = sea && sea.querySelector(".bubbles");
  const bubbles = []; // { el, x, y, s, rise, wobble, freq, phase }
  if (bubbleLayer) {
    BUBBLES.forEach(([x, y, s], i) => {
      const b = document.createElement("button");
      b.className = "bubble";
      b.tabIndex = -1;
      // see-through: opacity 0.75-0.85, varied per bubble
      const o = (0.75 + ((i * 37) % 11) / 100).toFixed(2);
      // layering: small bubbles in front of big ones
      const z = s < 6 ? 3 : s < 14 ? 2 : 1;
      // --bd = bob offset, --in = settle delay after the burst (0-0.35s)
      const inDelay = (((i * 53) % 36) / 100).toFixed(2);
      b.style.cssText = `--x:${x};--y:${y};--s:${s};--o:${o};z-index:${z};--d:${5 + (i % 5)}s;--bd:-${(i * 0.7).toFixed(1)}s;--in:${inDelay}s`;
      // pop! then float back a few seconds later
      b.addEventListener("click", () => {
        b.classList.add("popped");
        setTimeout(() => b.classList.remove("popped"), 3500);
      });
      bubbleLayer.appendChild(b);
      bubbles.push({
        el: b, x, y, s,
        // total scroll drift (vw): bigger bubbles feel closer, so they move
        // more. 3..~8vw total, i.e. at most ~4vw either side of the resting spot.
        rise: 3 + (s / 26.8) * 3 + ((i * 7) % 5) * 0.4,
        wobble: 0.4 + ((i * 3) % 5) * 0.12, // sideways sway amplitude (vw)
        freq: 1 + (i % 3) * 0.5,             // sway cycles per pass through the section
        phase: i * 1.7,
      });
    });
  }

  // Place resting bubbles for the current size: stretch the part below the
  // heading to the section's real height, then push any bubble that could
  // touch the heading or a logo (including its bob and scroll drift) sideways
  // out of the way. Uses offsetLeft/Top so the reveal animation's scale
  // doesn't affect it.
  function layoutBubbles() {
    if (!sea || !bubbles.length) return;
    const vw = window.innerWidth / 100;
    const seaHvw = sea.offsetHeight / vw;
    const stretch = (seaHvw - HEADING_Y) / (FIGMA_H - HEADING_Y);
    const keepClear = sponsorsBlock
      ? [...sponsorsBlock.querySelectorAll("h2, .sponsor")].map((el) => ({
          l: sponsorsBlock.offsetLeft + el.offsetLeft,
          t: sponsorsBlock.offsetTop + el.offsetTop,
          w: el.offsetWidth,
          h: el.offsetHeight,
        }))
      : [];
    const margin = 3 * vw; // room for the sideways sway
    for (const b of bubbles) {
      const y = b.y < HEADING_Y ? b.y : HEADING_Y + (b.y - HEADING_Y) * stretch;
      b.el.style.setProperty("--y", y.toFixed(2));
      const r = (b.s / 2) * vw;
      const drift = (b.rise / 2 + 1.6) * vw; // scroll drift + bob, up or down
      const cy = y * vw;
      let cx = b.x * vw;
      for (let pass = 0; pass < 4; pass++) {
        let moved = false;
        for (const k of keepClear) {
          const overlapX = cx + r > k.l - margin && cx - r < k.l + k.w + margin;
          const overlapY = cy + r + drift > k.t - margin && cy - r - drift < k.t + k.h + margin;
          if (overlapX && overlapY) {
            cx = cx < k.l + k.w / 2 ? k.l - margin - r : k.l + k.w + margin + r;
            moved = true;
          }
        }
        if (!moved) break;
      }
      b.el.style.setProperty("--nx", (cx - b.x * vw).toFixed(1) + "px");
    }
  }

  // ---------- Sponsors: bubble parallax ----------
  // Only runs while #sponsors is on screen, and never with reduced motion.
  let seaVisible = false;
  let bubbleTicking = false;

  function updateBubbles() {
    bubbleTicking = false;
    checkBurstTrigger();
    if (!seaVisible || reduceMotion.matches) return;
    const rect = sea.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the section's top enters at the bottom of the screen,
    // 1 when its bottom leaves at the top
    const t = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    const c = t - 0.5; // -0.5 .. 0.5
    for (const b of bubbles) {
      const dy = -c * b.rise; // scroll down -> rise up
      const dx = Math.sin(t * Math.PI * 2 * b.freq + b.phase) * b.wobble;
      b.el.style.setProperty("--px", dx.toFixed(3) + "vw");
      b.el.style.setProperty("--py", dy.toFixed(3) + "vw");
    }
  }

  function requestBubbles() {
    if (seaVisible && !bubbleTicking) {
      bubbleTicking = true;
      requestAnimationFrame(updateBubbles);
    }
  }

  function resetParallax() {
    for (const b of bubbles) {
      b.el.style.removeProperty("--px");
      b.el.style.removeProperty("--py");
    }
  }

  // ---------- Sponsors: "bubble up, then clear" transition ----------
  // .sea[data-phase]: "armed" (waiting) -> "burst" (temporary bubbles rise
  // through the screen) -> "settled" (resting bubbles and sponsors appear).
  // When the section fully leaves the screen it goes back to "armed", so the
  // burst replays next time. With reduced motion there's no data-phase at all.
  const burstLayer = sea && sea.querySelector(".burst");
  const SETTLE_AT = 950;   // ms after the trigger: burst starts clearing
  const CLEANUP_AT = 2000; // ms: everything temporary is gone by now
  let burstTimers = [];
  let burstAnims = [];

  function setPhase(phase) {
    if (phase) sea.dataset.phase = phase;
    else delete sea.dataset.phase;
  }

  function clearBurst() {
    burstTimers.forEach(clearTimeout);
    burstTimers = [];
    burstAnims.forEach((a) => a.cancel());
    burstAnims = [];
    if (burstLayer) burstLayer.replaceChildren();
  }

  // Trigger once ~30% of the section is on screen (capped at 60% of the
  // window, because on very wide screens 30% of this tall section never fits).
  function checkBurstTrigger() {
    if (!sea || sea.dataset.phase !== "armed" || !seaVisible) return;
    const r = sea.getBoundingClientRect();
    const visible = Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top);
    if (visible >= Math.min(0.3 * r.height, 0.6 * window.innerHeight)) playBurst();
  }

  function playBurst() {
    setPhase("burst");
    const rect = sea.getBoundingClientRect();
    const vw = window.innerWidth / 100;
    const W = sea.clientWidth;
    const H = sea.offsetHeight;
    // the part of the section on screen, in section coordinates
    const visTop = Math.max(0, -rect.top);
    const visBot = Math.min(H, window.innerHeight - rect.top);
    const visH = Math.max(visBot - visTop, 200);

    // Sizes 2-25vw, a good mix. Add bubbles until their total area is ~3.2x
    // the visible area (40-60 of them). They overlap and are spread along
    // their paths, so that's what it takes for the screen to look full at the
    // peak. If 60 isn't enough (tall screens), scale them all up (max 2.2x).
    const sizes = [];
    let area = 0;
    const target = 3.2 * W * visH;
    while (sizes.length < 60 && (sizes.length < 40 || area < target)) {
      const s = (2 + 23 * Math.pow(Math.random(), 0.8)) * vw;
      sizes.push(s);
      area += (Math.PI / 4) * s * s;
    }
    const grow = area < target ? Math.min(2.2, Math.sqrt(target / area)) : 1;

    for (const s0 of sizes) {
      const s = s0 * grow;
      const r = s / 2;
      const el = document.createElement("div");
      el.className = "burst-bubble";
      el.style.width = s.toFixed(1) + "px";
      burstLayer.appendChild(el);

      // Start in a band one screen tall below the visible area and rise two
      // screens, so halfway through the band fills the screen, then every
      // bubble ends above the visible area.
      const x0 = (-0.05 + Math.random() * 1.1) * W;
      const y0 = visBot + r + Math.random() * visH;
      const y1 = y0 - (2 * visH + s + 40);
      const wob = (0.5 + Math.random() * 1.5) * vw;  // sideways wobble
      const freq = 0.6 + Math.random() * 0.8;
      const ph = Math.random() * Math.PI * 2;
      const duration = 1050 + Math.random() * 350;    // 1.05-1.4s
      const delay = Math.pow(Math.random(), 1.3) * 320; // staggered over ~0.3s
      const pops = Math.random() < 0.3;                 // some pop on the way out
      const popAt = 0.6 + Math.random() * 0.2;

      const frames = [];
      const at = (u, scale, opacity) => {
        const ease = 0.75 * u + 0.25 * u * u * (3 - 2 * u);
        const x = x0 + Math.sin(u * Math.PI * 2 * freq + ph) * wob;
        const y = y0 + (y1 - y0) * ease;
        frames.push({
          offset: u,
          transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${scale})`,
          opacity,
        });
      };
      for (let j = 0; j <= 12; j++) {
        const u = j / 12;
        if (pops && u > popAt) break;
        const fadeIn = Math.min(1, u / 0.08);
        const fadeOut = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
        at(u, (0.85 + 0.15 * Math.min(1, u / 0.15)).toFixed(3), +(0.92 * fadeIn * fadeOut).toFixed(3));
      }
      if (pops) {
        at(popAt, 1, +(0.92 * (popAt > 0.75 ? 1 - (popAt - 0.75) / 0.25 : 1)).toFixed(3));
        at(Math.min(1, popAt + 0.07), 1.4, 0); // same pop as clicking: grow + vanish
        if (popAt + 0.07 < 1) at(1, 1.4, 0);
      }
      const anim = el.animate(frames, { duration, delay, easing: "linear", fill: "both" });
      anim.onfinish = () => el.remove();
      burstAnims.push(anim);
    }

    burstTimers.push(setTimeout(() => setPhase("settled"), SETTLE_AT));
    burstTimers.push(setTimeout(clearBurst, CLEANUP_AT));
  }

  function resetBurst() {
    clearBurst();
    if (sea) setPhase(reduceMotion.matches ? null : "armed");
  }

  if (sea && bubbles.length && "IntersectionObserver" in window) {
    layoutBubbles();
    window.addEventListener("load", layoutBubbles);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutBubbles);
    if ("ResizeObserver" in window && sponsorsBlock) new ResizeObserver(layoutBubbles).observe(sponsorsBlock);

    resetBurst();
    new IntersectionObserver((entries) => {
      seaVisible = entries[0].isIntersecting;
      if (!seaVisible) resetBurst(); // fully left: replay next time
      requestBubbles();
    }).observe(sea);

    const onMotionPref = () => {
      clearBurst();
      if (reduceMotion.matches) { setPhase(null); resetParallax(); }
      else { setPhase(seaVisible ? "settled" : "armed"); requestBubbles(); }
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", onMotionPref);
  }

  // ---------- Blimp countdown ----------
  // DevFest starts Sat Feb 6, 2027, 9:00 AM New York time (EST, UTC-5). Using
  // the exact moment makes it right in every visitor's time zone.
  const START = Date.parse("2027-02-06T09:00:00-05:00");
  const AFTER = Date.parse("2027-02-09T00:00:00-05:00"); // "after Feb 8"
  const cdLong = document.querySelector(".cd-long");
  const cdShort = document.querySelector(".cd-short");
  const cdLive = document.querySelector(".countdown-live");
  const pad = (n) => String(n).padStart(2, "0");

  function tickCountdown() {
    const now = Date.now();
    let long, short, spoken;
    if (now >= AFTER) {
      long = short = spoken = "Thanks for coming!";
    } else if (now >= START) {
      long = short = spoken = "Happening now!";
    } else {
      const mins = Math.floor((START - now) / 60000); // whole minutes left
      const d = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      const m = mins % 60;
      long = `${d} ${d === 1 ? "day" : "days"} ${pad(h)} hrs ${pad(m)} min`;
      short = `${d}d ${pad(h)}h ${pad(m)}m`;
      spoken = `DevFest starts in ${d} ${d === 1 ? "day" : "days"}, ${h} ${h === 1 ? "hour" : "hours"} and ${m} ${m === 1 ? "minute" : "minutes"}.`;
    }
    if (cdLong && cdLong.textContent !== long) cdLong.textContent = long;
    if (cdShort && cdShort.textContent !== short) cdShort.textContent = short;
    // the live region only changes when the minute does (no per-second spam)
    if (cdLive && cdLive.textContent !== spoken) cdLive.textContent = spoken;
    // run again just after the next whole second, so the minute ticks on time
    setTimeout(tickCountdown, 1000 - (Date.now() % 1000) + 20);
  }
  if (cdLong || cdShort) tickCountdown();

  window.addEventListener("scroll", () => { onScroll(); requestBubbles(); }, { passive: true });
  window.addEventListener("resize", () => { onScroll(); layoutBubbles(); requestBubbles(); });
  update();
})();
