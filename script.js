// ---------- Blimp countdown ----------
// Its own script block, first in the file, so nothing else on the page can
// stop it: if any other part of the page throws, the countdown still runs.
// Ticks every second (setInterval), recomputing from (target - now) each
// time, so it can't drift; a tick that fails is caught and the next one
// runs anyway. Nothing else writes to the banner text.
(() => {
  // Sat Feb 6, 2027, 9:00 AM New York time (EST = UTC-5). An exact moment,
  // so it's right in every visitor's time zone.
  const TARGET = new Date("2027-02-06T09:00:00-05:00").getTime();
  const AFTER = new Date("2027-02-09T00:00:00-05:00").getTime(); // after Feb 8
  const cdLong = document.querySelector(".cd-long");   // desktop banner
  const cdShort = document.querySelector(".cd-short"); // phone banner
  const cdLive = document.querySelector(".countdown-live"); // screen readers
  if (!cdLong && !cdShort) return;
  const pad = (n) => String(n).padStart(2, "0");
  // Each number sits in a fixed-width slot (as wide as its digits would be
  // if they were all the widest digit), so the text never jiggles as the
  // seconds change, even in a font without tabular figures.
  const num = (v) => `<span class="cd-num" style="--n:${v.length}">${v}</span>`;
  const blimpEl = document.querySelector(".blimp");
  function measureDigits() {
    try {
      const c = document.createElement("canvas").getContext("2d");
      c.font = '700 100px Gaegu, "Comic Sans MS", cursive';
      let w = 0;
      for (const d of "0123456789") w = Math.max(w, c.measureText(d).width);
      if (w > 0 && blimpEl) blimpEl.style.setProperty("--digit-w", (w / 100).toFixed(3) + "em");
    } catch (e) { /* keep the CSS default */ }
  }
  measureDigits();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureDigits);
  let logged = false;

  function parts(now) {
    const total = Math.max(0, Math.floor((TARGET - now) / 1000)); // whole seconds left
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  }

  function tick() {
    try {
      const now = Date.now();
      let long, short, spoken;
      if (now >= AFTER) {
        long = short = spoken = "Thanks for coming!";
      } else if (now >= TARGET) {
        long = short = spoken = "Happening now!";
      } else {
        const { days: d, hours: h, minutes: m, seconds: s } = parts(now);
        long = `${num(String(d))} ${d === 1 ? "day" : "days"} ${num(pad(h))} hrs ${num(pad(m))} min ${num(pad(s))} sec`;
        short = `${num(String(d))}d ${num(pad(h))}h ${num(pad(m))}m ${num(pad(s))}s`;
        // screen readers: once a minute, not every second
        spoken = `DevFest starts in ${d} ${d === 1 ? "day" : "days"}, ${h} ${h === 1 ? "hour" : "hours"} and ${m} ${m === 1 ? "minute" : "minutes"}.`;
        if (!logged) {
          logged = true;
          console.log("[countdown] target", new Date(TARGET).toISOString(), "now", new Date(now).toISOString(), { days: d, hours: h, minutes: m, seconds: s });
        }
      }
      // (only numbers and fixed words go in here, so innerHTML is safe)
      if (cdLong && cdLong.innerHTML !== long) cdLong.innerHTML = long;
      if (cdShort && cdShort.innerHTML !== short) cdShort.innerHTML = short;
      if (cdLive && cdLive.textContent !== spoken) cdLive.textContent = spoken;
    } catch (e) {
      console.error("[countdown] tick failed, will retry next second", e);
    }
  }

  tick();                         // right away on load
  setInterval(tick, 1000);
  // background tabs slow timers down: catch up the moment it's visible again
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
})();

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
  // The burst bubbles live in their own layer on the page (not inside the
  // sea, whose overflow: hidden would cut them off at its top edge). It
  // covers the sea plus the whole section above it, sits over everything
  // there (painting, trains, signs), fades out towards its top (mask) and is
  // never clickable. Placed fresh for each burst; bubbles removed as they end.
  let burstLayer = null;
  let burstUp = 0;           // how far the layer reaches above the sea (px)
  function placeBurstLayer() {
    if (!burstLayer) {
      burstLayer = document.createElement("div");
      burstLayer.className = "burst-layer";
      burstLayer.setAttribute("aria-hidden", "true");
      document.body.appendChild(burstLayer);
    }
    const above = sea.previousElementSibling;
    burstUp = above ? above.offsetHeight : window.innerHeight;
    const seaTop = sea.getBoundingClientRect().top + window.scrollY;
    burstLayer.style.top = (seaTop - burstUp).toFixed(0) + "px";
    burstLayer.style.height = (burstUp + sea.offsetHeight).toFixed(0) + "px";
    const fade = `linear-gradient(transparent, #000 ${(burstUp * 0.75).toFixed(0)}px)`;
    burstLayer.style.webkitMaskImage = fade;
    burstLayer.style.maskImage = fade;
  }
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
    placeBurstLayer();
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
      // (sea coordinates, shifted into the layer, which starts burstUp higher)
      const y0 = burstUp + visBot + r + Math.random() * visH;
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

  // ---------- Speakers & Judges: subway trains ----------
  // While the section is on screen, one train at a time rolls through the
  // station car by car (headlights on the way in, red tail lights on the way
  // out); when it's about halfway out, the other one starts arriving on its
  // own track. Hovering a train (or tapping it) pauses both; the car dots
  // jump to a car. Starts over from the left-bound train each time the
  // section comes back. The "now arriving" announcement plays once per page
  // load, as the left-bound train's last car rolls in.
  // Each .train gets data-state: waiting -> arrive -> stopped -> depart.
  // Reduced motion: both parked at the end of the platform, no movement.
  const subway = document.querySelector(".subway");
  const tracks = subway && subway.querySelector(".tracks");
  const trainL = subway && subway.querySelector(".train--left");  // far track
  const trainR = subway && subway.querySelector(".train--right"); // near track
  const soundBtn = subway && subway.querySelector(".sound-toggle");

  // Car-by-car timing (ms)
  const ROLL = 3000;       // one car length, arriving (eases to a stop)
  const ROLL_OUT = 2200;   // one car length, leaving
  const PAUSE = 1100;      // between car lengths, arriving
  const PAUSE_OUT = 700;   // between car lengths, leaving
  const END_PAUSE = 2200;  // at the end of the platform, before leaving
  const JUMP = 900;        // sliding to a car picked with the dots
  const DOT_HOLD = 8000;   // ...then it stays paused this long without interaction

  // ----- Sound (Web Audio, synthesized: no audio files) -----
  // Browsers only allow sound after the visitor has clicked/tapped/pressed a
  // key on the page, so the audio is unlocked on the first such gesture.
  // Scrolling alone doesn't count, so the very first visit may be silent.
  const AC = window.AudioContext || window.webkitAudioContext;
  let actx = null, master = null, duck = null, out = null, speaker = null, voiceIn = null;
  let brownBuf = null, whiteBuf = null;
  const VOLUME = 0.385;    // train sounds + chimes: 70% of the original 0.55
  const ANNOUNCE_VOLUME = 0.7;  // the announcement, 70% of full
  const DUCK = 0.4;        // trains drop to this while the announcement speaks
  let soundOn = true;
  let audioUnlocked = false; // the browser has let the audio run at least once
  let audioHeld = false;     // trains paused: audio frozen too (see holdAudio)
  try { soundOn = localStorage.getItem("devfest-sound") !== "off"; } catch (e) {}

  function unlockAudio() {
    if (!AC || !soundOn) return;
    if (!actx) {
      actx = new AC();
      // Signal chain:
      //   train sounds, chime -> master (VOLUME) -> duck -> bus
      //   announcement        -> station PA band-pass -> voice (ANNOUNCE_VOLUME) -> bus
      //   bus -> out (Sound on/off) -> speakers, plus bus -> reverb -> out
      // duck = trains turned down while the announcement plays. The reverb is
      // a short generated "tiled hall" echo on everything.
      master = actx.createGain();
      master.gain.value = VOLUME;
      duck = actx.createGain();
      const bus = actx.createGain();
      out = actx.createGain();
      out.gain.value = soundOn ? 1 : 0;
      master.connect(duck).connect(bus).connect(out).connect(actx.destination);
      const verb = actx.createConvolver();
      const len = Math.floor(actx.sampleRate * 1.4);
      const ir = actx.createBuffer(2, len, actx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      verb.buffer = ir;
      const wet = actx.createGain();
      wet.gain.value = 0.2;
      bus.connect(verb).connect(wet).connect(out);
      // chime: a band-pass "platform speaker"
      const hp = actx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 420; hp.Q.value = 0.7;
      const lp = actx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 3400; lp.Q.value = 0.9;
      speaker = hp;
      hp.connect(lp).connect(master);
      // announcement recording: station PA band-pass ~300-3500 Hz, a slight
      // mid-range lift, then its own volume, straight onto the bus (not ducked)
      const vhp = actx.createBiquadFilter();
      vhp.type = "highpass"; vhp.frequency.value = 300; vhp.Q.value = 0.8;
      const vlp = actx.createBiquadFilter();
      vlp.type = "lowpass"; vlp.frequency.value = 3500; vlp.Q.value = 0.8;
      const vmid = actx.createBiquadFilter();
      vmid.type = "peaking"; vmid.frequency.value = 1600; vmid.Q.value = 0.9; vmid.gain.value = 4;
      const vgain = actx.createGain();
      vgain.gain.value = ANNOUNCE_VOLUME;
      vhp.connect(vlp).connect(vmid).connect(vgain).connect(bus);
      voiceIn = vhp;
      actx.onstatechange = () => { if (actx.state === "running") audioUnlocked = true; };
      loadAnnouncement();
    }
    if (actx.state === "suspended" && !audioHeld) actx.resume();
  }
  ["pointerdown", "keydown", "touchend"].forEach((t) =>
    window.addEventListener(t, unlockAudio, { passive: true }));

  // ready = allowed by the browser and Sound is on. While the trains are
  // paused the context is suspended, which freezes sounds mid-way; anything
  // scheduled then plays when they resume, in step with the movement.
  const audioReady = () => soundOn && actx && audioUnlocked;

  function holdAudio(hold) {
    audioHeld = hold;
    if (actx && audioUnlocked) { if (hold) actx.suspend(); else if (soundOn) actx.resume(); }
    if (window.speechSynthesis) { if (hold) speechSynthesis.pause(); else speechSynthesis.resume(); }
  }

  function noise(brown) {
    if (brown && brownBuf) return brownBuf;
    if (!brown && whiteBuf) return whiteBuf;
    const len = actx.sampleRate * 2;
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return brown ? (brownBuf = buf) : (whiteBuf = buf);
  }

  function panner(t0, from, to, dur) {
    if (!actx.createStereoPanner) return master;
    const p = actx.createStereoPanner();
    p.pan.setValueAtTime(from, t0);
    p.pan.linearRampToValueAtTime(to, t0 + dur);
    p.connect(master);
    return p;
  }

  // one "clack" of the wheels over a rail joint
  function clack(t, out, vol) {
    const src = actx.createBufferSource();
    src.buffer = noise(false);
    const bp = actx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 1.4;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bp).connect(g).connect(out);
    src.start(t, Math.random() * 1.5, 0.1);
  }

  // Train sound only at two moments (the car-by-car slides in between are
  // silent): "arrive" = rumble + wheel clacks as it first pulls in, slowing
  // and fading out by its first stop; "leave" = rumble + clacks as it pulls
  // out, speeding up and fading as it goes off-screen. Panned from where the
  // train is to where it's going. No squeal or whistle tones anywhere.
  function trainSound({ kind, dur, panFrom, panTo, vol }) {
    if (!audioReady()) return;
    const arriving = kind === "arrive";
    const t0 = actx.currentTime + 0.03;
    const end = t0 + dur;
    const out = panner(t0, panFrom, panTo, dur);

    // rumble
    const src = actx.createBufferSource();
    src.buffer = noise(true);
    src.loop = true;
    const lp = actx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(arriving ? 420 : 160, t0);
    lp.frequency.exponentialRampToValueAtTime(arriving ? 120 : 460, end);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    if (arriving) {           // already rolling when it appears, dies away as it stops
      g.gain.linearRampToValueAtTime(vol, t0 + 0.35);
      g.gain.linearRampToValueAtTime(vol * 0.45, t0 + dur * 0.6);
      g.gain.linearRampToValueAtTime(0.0001, end);
    } else {                  // starts up, then fades into the tunnel
      g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, end);
    }
    src.connect(lp).connect(g).connect(out);
    src.start(t0);
    src.stop(end + 0.1);

    // wheels: pairs of clacks, spreading out as it slows (or bunching up as it speeds away)
    let t = t0 + 0.08;
    while (t < end - 0.25) {
      const u = (t - t0) / dur;                      // 0..1
      const gap = arriving ? 0.2 + 0.55 * u * u : 0.75 - 0.5 * u;
      const fade = arriving ? 1 - u : Math.min(1, u * 4) * (1 - u);
      const v = (0.05 * vol / 0.35) * fade + 0.0002;
      clack(t, out, v);
      clack(t + 0.085, out, v * 0.8);
      t += gap;
    }
  }

  // "chhhh": the air brakes letting go once a train has stopped. A short
  // burst of soft filtered noise (~0.8 s) that fades out, panned to the train.
  function hiss(pan, vol) {
    if (!audioReady()) return;
    const t0 = actx.currentTime + 0.03;
    const out = panner(t0, pan, pan, 0.9);
    const src = actx.createBufferSource();
    src.buffer = noise(false);
    const hp = actx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1800;
    const lp = actx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 6500;
    lp.frequency.setValueAtTime(6500, t0);
    lp.frequency.exponentialRampToValueAtTime(3200, t0 + 0.8);
    const g = actx.createGain();
    const peak = 0.11 * vol / 0.35;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.04);
    g.gain.setValueAtTime(peak, t0 + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
    src.connect(hp).connect(lp).connect(g).connect(out);
    src.start(t0, Math.random(), 0.85);
  }

  // "Uptown 1 train... now arriving." - a two-tone chime, then the
  // browser's built-in speech in two parts with a short pause, the trains
  // turned down underneath so it's clearly heard. (The speech itself can't be
  // run through the band-pass/reverb: browsers don't expose its audio.)
  let voice = null;
  // the most natural-sounding English voice available
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!vs.length) return;
    const en = vs.filter((v) => /^en([-_]|$)/i.test(v.lang));
    const score = (v) =>
      (/natural|neural/i.test(v.name) ? 100 : 0) +
      (/online/i.test(v.name) ? 40 : 0) +
      (/aria|jenny|google us english|samantha|ava|allison/i.test(v.name) ? 25 : 0) +
      (/US/i.test(v.lang) ? 10 : 0) +
      (v.default ? 2 : 0);
    voice = en.sort((x, y) => score(y) - score(x))[0] || vs.find((v) => v.default) || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    // voices usually load a moment after the page; pick again when they do
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickVoice);
    else speechSynthesis.onvoiceschanged = pickVoice;
  }
  function setDuck(on, at) {
    if (duck) duck.gain.setTargetAtTime(on ? DUCK : 1, at || actx.currentTime, on ? 0.15 : 0.4);
  }
  // a wait that stands still while the trains (and sound) are paused
  function audioWait(ms, cb) {
    let left = ms, last = performance.now();
    const step = () => {
      const now = performance.now();
      if (!audioHeld) left -= now - last;
      last = now;
      if (left <= 0) cb(); else setTimeout(step, 50);
    };
    setTimeout(step, 50);
  }
  // A real recording, if there is one: assets/announcement.mp3. Fetched and
  // decoded once (when the audio unlocks) so it plays through Web Audio, with
  // the same volume control, the station PA band-pass and the reverb. Missing
  // or broken file (or opened from file://, where fetch isn't allowed): the
  // speech fallback above is used instead.
  let annBuf = null;
  let annLoading = null;
  function loadAnnouncement() {
    // (pages opened straight from disk, file://, aren't allowed to fetch)
    if (annLoading || !actx || !window.fetch || location.protocol === "file:") return;
    annLoading = fetch("assets/announcement.mp3")
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((data) => new Promise((res, rej) => actx.decodeAudioData(data, res, rej)))
      .then((buf) => { annBuf = buf; })
      .catch(() => { annBuf = null; });   // fine: speech synthesis it is
  }

  // Two-tone chime, then "Uptown 1 train... now arriving.": the recording
  // if it loaded, otherwise the browser's speech in two parts with a short
  // pause. Trains are turned down underneath so it's clearly heard.
  // Returns false if it couldn't play (sound not allowed yet / off).
  function announce() {
    if (!audioReady() || reduceMotion.matches) return false;
    chime(0.06);
    if (annBuf) {
      const src = actx.createBufferSource();
      src.buffer = annBuf;
      src.connect(voiceIn);
      const at = actx.currentTime + 0.9;     // after the chime's first note
      src.start(at);
      setDuck(true, at - 0.1);
      src.onended = () => setDuck(false);
      return true;
    }
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) return true;
    if (!voice) pickVoice();
    const say = (text) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "en-US";
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = ANNOUNCE_VOLUME;
      return u;
    };
    const first = say("Uptown 1 train...");
    const second = say("...now arriving.");
    const done = () => setDuck(false);
    first.onend = () => audioWait(400, () => { if (soundOn) synth.speak(second); else done(); });
    first.onerror = done;
    second.onend = done;
    second.onerror = done;
    synth.cancel();
    audioWait(900, () => {             // after the chime's first note
      if (!soundOn) return;
      setDuck(true);
      synth.speak(first);
    });
    return true;
  }

  // two-note "ding-dong" (doors / announcement)
  function chime(level = 0.07) {
    if (!audioReady()) return;
    const t0 = actx.currentTime + 0.05;
    [[659.25, 0], [523.25, 0.42]].forEach(([f, dt]) => {
      const o = actx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(level, t0 + dt + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 1.2);
      o.connect(g).connect(speaker || master);
      o.start(t0 + dt);
      o.stop(t0 + dt + 1.25);
    });
  }

  function setSound(on, fromClick) {
    soundOn = on;
    if (fromClick) { try { localStorage.setItem("devfest-sound", on ? "on" : "off"); } catch (e) {} }
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.querySelector(".sound-toggle__label").textContent = on ? "Sound on" : "Sound off";
    if (on && fromClick) unlockAudio();
    // mute right away (including a train that's already rumbling)
    if (out) out.gain.setTargetAtTime(on ? 1 : 0, actx.currentTime, 0.05);
    if (!on && window.speechSynthesis) { speechSynthesis.cancel(); setDuck(false); }
  }
  if (soundBtn) {
    if (!AC) soundBtn.hidden = true;
    setSound(soundOn);
    soundBtn.addEventListener("click", () => setSound(!soundOn, true));
  }

  // ----- Trains: one at a time, car by car -----
  // Positions are px along the track (translate). A train rolls forward one
  // car length, pauses, rolls another... until its front reaches the end of
  // the platform; it waits there, then rolls on out the same way. Once it's
  // about halfway off the screen, the other train starts rolling in on its
  // own track.
  //
  // Measured from the art (fractions of the train's length), cars numbered
  // left to right as they appear on screen:
  const CAR = 0.2455;              // car pitch: front of one car to the next
  const BUSY = [0.0647, 0.1919];   // left-bound car 1: windows + info panel
  const FRONT_WINDOW = { "-1": 0.149, "1": 0.8507 };   // front car's window center
  const CAR_CENTER = { "-1": [0.119, 0.3645, 0.61, 0.8555], "1": [0.146, 0.3915, 0.637, 0.8825] };
  const WIN_CENTER = { "-1": [0.149, 0.3935, 0.6407, 0.8848], "1": [0.1148, 0.3593, 0.6062, 0.8507] };

  function makeTrain(el, dir /* -1 = heads left, 1 = heads right */) {
    const row = el.parentElement;
    const t = { el, dir, row, anim: null, jumpAnim: null, idle: Promise.resolve() };

    t.setState = (s) => { el.dataset.state = s; };
    t.place = (x) => { t.x = x; el.style.translate = `${x.toFixed(1)}px 0`; };
    // where it is on screen right now, even mid-slide
    t.currentX = () => {
      if (!t.anim && !t.jumpAnim) return t.x;
      const v = parseFloat(getComputedStyle(el).translate);
      return Number.isFinite(v) ? v : t.x;
    };
    t.stop = () => {
      if (t.anim) { t.anim.cancel(); t.anim = null; }
      if (t.jumpAnim) { t.jumpAnim.cancel(); t.jumpAnim = null; }
      delete el.dataset.moving;
    };

    // Where it pauses, for the current screen size.
    t.plan = () => {
      const W = row.clientWidth;
      const L = el.offsetWidth;
      const C = CAR * L;
      // End of the platform: the front car right at the far edge. If one car
      // is wider than the screen (phones), center the front car's window.
      const end = C <= W
        ? (dir < 0 ? 0 : W - L)
        : W / 2 - FRONT_WINDOW[dir] * L;
      const shown = (x) => Math.min(W, x + L) - Math.max(0, x);
      // arriving: from fully off-screen (behind it) to the end, a car at a time
      const k = Math.ceil((dir < 0 ? W - end : end + L) / C);
      const arrive = [];
      for (let i = k; i >= 0; i--) arrive.push(end - dir * i * C);
      // leaving: on a car at a time until fully off-screen ahead of it
      const exit = dir < 0 ? -L : W;
      const leave = [];
      for (let i = 1; ; i++) {
        const x = end + dir * i * C;
        if (dir < 0 ? x <= exit : x >= exit) break;
        leave.push(x);
      }
      leave.push(exit);
      // skip pauses where barely any of the train is on screen
      const worth = (x) => shown(x) >= 0.3 * Math.min(C, W);
      return {
        W, L, C, end,
        arrive: arrive.filter((x, i) => i === 0 || i === arrive.length - 1 || worth(x)),
        leave: leave.filter((x, i) => i === leave.length - 1 || worth(x)),
      };
    };

    // Roll to x. Resolves "done" when it gets there, or "cancel" if it was
    // interrupted (a car-dot jump, or the sequence stopping).
    t.roll = (x, ms, easing, paused) => new Promise((res) => {
      const from = t.currentX();
      t.stop();
      t.place(x);
      el.dataset.moving = "";
      const a = el.animate([{ translate: `${from}px 0` }, { translate: `${x}px 0` }], { duration: ms, easing });
      t.anim = a;
      if (paused) a.pause();
      a.onfinish = () => { if (t.anim === a) { t.anim = null; delete el.dataset.moving; } res("done"); };
      a.oncancel = () => res("cancel");
    });

    // Glide straight to x (car dots). Not affected by the pause.
    t.jumpTo = (x, ms) => {
      const from = t.currentX();
      t.stop();
      t.place(x);
      if (ms > 0) {
        t.jumpAnim = el.animate([{ translate: `${from}px 0` }, { translate: `${x}px 0` }],
          { duration: ms, easing: "cubic-bezier(.45, 0, .25, 1)" });
        t.jumpAnim.onfinish = () => { t.jumpAnim = null; };
      }
    };
    return t;
  }

  if (subway && tracks && trainL && trainR && "IntersectionObserver" in window) {
    const far = makeTrain(trainL, -1);   // speakers, far track
    const near = makeTrain(trainR, 1);   // judges, near track
    far.vol = 0.26;
    near.vol = 0.35;
    const order = [far, near];
    const dotsBox = subway.querySelector(".car-dots");
    const dots = dotsBox ? [...dotsBox.querySelectorAll(".car-dot")] : [];
    const playBtn = dotsBox && dotsBox.querySelector(".car-play");
    let runId = 0;
    let running = false;
    let onScreen = false;
    let active = far;          // the train in the station (the dots follow it)
    let announced = false;     // "now arriving": once per page load (a refresh resets it)
    const STOP = new Error("stopped");
    const check = (id) => { if (id !== runId) throw STOP; };

    // ----- Pausing -----
    // Reasons it's paused: "hover" (mouse over a train), "tap" (a train was
    // tapped on a touch screen), "dot" (a car was picked with the dots),
    // "button" (the pause button). Paused = movement, waits and sound all
    // frozen exactly where they are.
    const reasons = new Set();
    const isPaused = () => reasons.size > 0;
    const held = () => reasons.has("tap") || reasons.has("dot") || reasons.has("button");
    function setPause(reason, on) {
      const was = isPaused();
      if (on) reasons.add(reason); else reasons.delete(reason);
      const now = isPaused();
      if (was !== now) {
        for (const t of order) if (t.anim) { if (now) t.anim.pause(); else t.anim.play(); }
        holdAudio(now);
      }
      subway.toggleAttribute("data-paused", now);
      subway.toggleAttribute("data-held", held());
      if (playBtn) playBtn.setAttribute("aria-label", held() ? "Play the trains" : "Pause the trains");
    }
    function clearPauses() {
      for (const r of [...reasons]) setPause(r, false);
      endDotHold(true);
    }

    // a wait that stands still while paused
    const sleep = (ms, id) => new Promise((res) => {
      let left = ms;
      let last = performance.now();
      const tick = (now) => {
        if (id !== runId) return;
        if (!isPaused()) left -= now - last;
        last = now;
        if (left <= 0) res(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const whenRunning = (id) => sleep(1, id);

    // stereo position of whatever part of the train is on screen
    const panAt = (x, p) => {
      const a = Math.max(0, x), b = Math.min(p.W, x + p.L);
      const c = b > a ? (a + b) / 2 : x < 0 ? 0 : p.W;
      return Math.max(-1, Math.min(1, (c / p.W) * 2 - 1)) * 0.75;
    };

    // Put the pillar where it never hides a name on the left-bound train:
    // clear of the name windows + info panels both where the train pauses
    // (whole car lengths apart, so every pause lines up the same way) and
    // when the car dots center a car's window. As close to the middle as
    // that allows.
    function placePillar() {
      const p = far.plan();
      const pillarEl = subway.querySelector(".pillar");
      const half = (pillarEl ? pillarEl.getBoundingClientRect().width : 40) / 2;
      const spans = [];   // busy [from, to] in screen px, repeating every car
      const add = (x0) => { for (let m = -8; m <= 8; m++) spans.push([x0 + BUSY[0] * p.L + m * p.C, x0 + BUSY[1] * p.L + m * p.C]); };
      add(p.end);                                   // the pauses
      add(p.W / 2 - WIN_CENTER["-1"][0] * p.L);     // a car centered by the dots
      let best = null, bestCost = Infinity;
      for (let x = half + 4; x <= p.W - half - 4; x += 2) {
        let cost = 0;
        for (const [a, b] of spans) cost += Math.max(0, Math.min(b, x + half + 6) - Math.max(a, x - half - 6));
        cost = cost * 1000 + Math.abs(x - p.W / 2);  // clear first, then central
        if (cost < bestCost) { bestCost = cost; best = x; }
      }
      subway.style.setProperty("--pillar-x", best === null ? "50%" : best.toFixed(0) + "px");
    }

    // Roll through a list of stops, a car length at a time. After a car-dot
    // jump it carries on from wherever the train now is. o.before(i, x, p) /
    // o.after(i, x, p) run around the roll to stop i (sounds, announcement).
    async function travel(t, points, o, id) {
      const ahead = (x) => (t.dir < 0 ? x < t.x - 1 : x > t.x + 1);
      let i = 0;
      while (i < points.length) {
        while (i < points.length && !ahead(points[i])) i++;
        if (i >= points.length) break;
        const x = points[i];
        const last = i === points.length - 1;
        const p = t.plan();
        if (o.before) o.before(i, x, p);
        const r = await t.roll(x, o.ms, o.easing(i, last), isPaused());
        check(id);
        if (r === "cancel") { await whenRunning(id); check(id); continue; }
        if (o.after) o.after(i, x, p);
        i++;
        if (!last) { await sleep(o.pause, id); check(id); }
      }
    }

    // Start the next train once this one is about halfway off the screen
    // (half of what was showing when it started leaving has gone).
    function whenHalfGone(t, id, cb) {
      const shown = () => {
        const r = t.el.getBoundingClientRect();
        const rr = t.row.getBoundingClientRect();
        return Math.max(0, Math.min(r.right, rr.right) - Math.max(r.left, rr.left));
      };
      const start = shown();
      const tick = () => {
        if (id !== runId) return;
        if (t.el.dataset.state !== "depart" || shown() <= start * 0.5) cb();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    // One train's trip through the station. Sound only at:
    //   the first roll in from off-screen (rumble + clacks, fading out as it
    //     reaches its first stop) and the air-brake hiss at that stop;
    //   the roll that brings the last car (car 4) into the station: the hiss
    //     again at that stop, and on the left-bound train the "now arriving"
    //     announcement (once per page load);
    //   the final roll off-screen (rumble + clacks, fading as it goes).
    // Every other car-by-car slide is silent.
    async function pass(t, id) {
      await t.idle;                    // still finishing its last trip? wait
      check(id);
      const p = t.plan();
      t.place(p.arrive[0]);
      t.setState("arrive");            // headlights on
      setActive(t);
      await travel(t, p.arrive.slice(1), {
        ms: ROLL, pause: PAUSE,
        // the first roll comes in at speed and brakes; the rest ease in/out
        easing: (i) => (i === 0 ? "cubic-bezier(.15, .55, .3, 1)" : "cubic-bezier(.4, 0, .2, 1)"),
        before: (i, x, q) => { if (i === 0) trainSound({ kind: "arrive", dur: ROLL / 1000, panFrom: panAt(t.x, q), panTo: panAt(x, q), vol: t.vol }); },
        after: (i, x, q) => { if (i === 0) hiss(panAt(x, q), t.vol); },
      }, id);
      t.setState("stopped");           // at the end of the platform
      chime();
      await sleep(END_PAUSE, id);
      check(id);
      t.setState("depart");            // tail lights on
      whenHalfGone(t, id, () => go(t === far ? near : far, id));
      const lastCar = p.leave.length - 2;   // the stop that brings car 4 in (-1: none)
      await travel(t, p.leave, {
        ms: ROLL_OUT, pause: PAUSE_OUT,
        easing: (i, last) => (last ? "cubic-bezier(.5, 0, .9, .6)" : "cubic-bezier(.45, 0, .25, 1)"),
        before: (i, x, q) => {
          if (i === lastCar && t === far && !announced) announced = announce();
          if (i === p.leave.length - 1) trainSound({ kind: "leave", dur: ROLL_OUT / 1000, panFrom: panAt(t.x, q), panTo: panAt(x, q), vol: t.vol });
        },
        after: (i, x, q) => { if (i === lastCar) hiss(panAt(x, q), t.vol); },
      }, id);
      t.setState("waiting");
    }

    function go(t, id) {
      t.idle = pass(t, id).catch(() => {});
    }

    // ----- Car dots -----
    // The row follows the train in the station; the car nearest the middle
    // of the screen gets the lit dot (checked every frame while on screen).
    function setActive(t) {
      active = t;
      if (!dotsBox) return;
      dotsBox.dataset.track = t === far ? "far" : "near";
      const names = [...t.el.querySelectorAll(".rider__name")].map((n) => n.textContent.trim());
      dots.forEach((d, k) => d.setAttribute("aria-label", `Go to car ${k + 1}` + (names[k] ? `: ${names[k]}` : "")));
    }
    let lit = -1;
    function highlight() {
      if (!onScreen || !dotsBox) return;
      const r = active.el.getBoundingClientRect();
      const rr = active.row.getBoundingClientRect();
      const mid = rr.left + rr.width / 2;
      let best = -1, bestD = Infinity;
      if (active.el.dataset.state !== "waiting" && r.right > rr.left && r.left < rr.right) {
        CAR_CENTER[active.dir].forEach((f, k) => {
          const d = Math.abs(r.left + f * r.width - mid);
          if (d < bestD) { bestD = d; best = k; }
        });
      }
      if (best !== lit) {
        lit = best;
        dots.forEach((d, k) => { if (k === best) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      }
      requestAnimationFrame(highlight);
    }

    // Picking a car: pause both trains and glide that car (its name window)
    // to the middle. It
    // stays paused until the same dot / the play button is clicked, or 8 s
    // pass with no interaction in the section.
    let picked = null;
    let dotTimer = 0;
    function armDotTimer() {
      clearTimeout(dotTimer);
      dotTimer = setTimeout(() => endDotHold(), DOT_HOLD);
    }
    function endDotHold(quiet) {
      clearTimeout(dotTimer);
      picked = null;
      if (!quiet) setPause("dot", false);
    }
    function pickCar(k) {
      const t = active;
      const p = t.plan();
      const frac = WIN_CENTER[t.dir][k];   // its name window in the middle
      const x = p.W / 2 - frac * p.L;
      if (reduceMotion.matches) { t.jumpTo(x, 0); return; }   // just show it
      if (reasons.has("dot") && picked === k) { endDotHold(); return; }
      picked = k;
      setPause("dot", true);
      armDotTimer();
      if (t.el.dataset.state === "waiting") t.setState("arrive");
      t.jumpTo(x, JUMP);
    }
    dots.forEach((d, k) => d.addEventListener("click", () => pickCar(k)));
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        if (held()) { setPause("tap", false); setPause("button", false); endDotHold(); }
        else setPause("button", true);
      });
    }
    ["pointerdown", "pointermove", "keydown", "wheel"].forEach((type) =>
      subway.addEventListener(type, () => { if (reasons.has("dot")) armDotTimer(); }, { passive: true }));

    // ----- Hover / tap to pause -----
    for (const t of order) {
      t.el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setPause("hover", true); });
      t.el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setPause("hover", false); });
      t.el.addEventListener("pointerup", (e) => {
        if (e.pointerType !== "mouse") setPause("tap", !reasons.has("tap"));
      });
    }

    // ----- Start / stop -----
    function stopAll() {
      runId++;
      running = false;
      clearPauses();
      if (window.speechSynthesis) speechSynthesis.cancel();
      setDuck(false);
      for (const t of order) {
        t.stop();
        t.idle = Promise.resolve();
        const p = t.plan();
        if (reduceMotion.matches) {    // parked at the end of the platform
          t.place(p.end);
          t.setState("stopped");
        } else {
          t.place(p.arrive[0]);
          t.setState("waiting");
        }
      }
      setActive(far);
      if (playBtn) playBtn.hidden = reduceMotion.matches;
      placePillar();
    }

    function start() {
      if (running || reduceMotion.matches) return;
      stopAll();
      running = true;
      go(far, runId);                  // the left-bound train goes first
    }

    if (dotsBox) dotsBox.hidden = false;
    stopAll();
    // Runs while the section is on screen; starts over each time it comes back.
    new IntersectionObserver((entries) => {
      const e = entries[0];
      const was = onScreen;
      onScreen = e.isIntersecting;
      if (onScreen && !was) requestAnimationFrame(highlight);
      if (!e.isIntersecting) stopAll();
      else if (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= 0.6 * window.innerHeight) start();
    }, { threshold: [0, 0.1, 0.2, 0.35, 0.5] }).observe(subway);

    let resizeTimer = 0;
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastW) return;   // phone toolbars showing/hiding
      lastW = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const was = running;
        stopAll();
        if (was && onScreen) start();
      }, 250);
    });
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", () => { stopAll(); if (onScreen) start(); });
    }
  }

  // ----- Sponsors: big bubbles rising up out of the sea -----
  // Drawn twice, identically (same position, size and timing, created in
  // the same frame so they stay in step): in the sea and in the subway
  // section above, so each one looks like a single bubble crossing the edge
  // (styles.css .rising). Pseudo-random but the same on every visit.
  const risers = document.querySelectorAll(".rising");
  if (risers.length) {
    const R = (i, n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 7; i++) {
      const t = 17 + R(i, 1) * 10;                 // 17-27 s for the whole rise
      // spread across the width in 7 lanes, a little jitter in each
      const style = `--x:${(2 + (i * 13.4) + R(i, 2) * 6).toFixed(1)};--s:${(10 + R(i, 3) * 7).toFixed(1)};` +
        `--t:${t.toFixed(1)}s;--d:-${(R(i, 4) * t).toFixed(1)}s;--w:${(3 + R(i, 5) * 2.5).toFixed(1)}s`;
      risers.forEach((layer) => {
        const b = document.createElement("div");
        b.className = "rise-bubble";
        b.style.cssText = style;
        layer.appendChild(b);
      });
    }
  }

  window.addEventListener("scroll", () => { onScroll(); requestBubbles(); }, { passive: true });
  window.addEventListener("resize", () => { onScroll(); layoutBubbles(); requestBubbles(); });
  update();
})();
