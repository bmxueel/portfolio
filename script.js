// ============================================================
// PORTFOLIO VIDEOS: edit this list to change the videos.
// Paste any YouTube link (watch, youtu.be or shorts) as `url`.
// ============================================================
const VIDEOS = [
  { title: "Video Project 1", tag: "Long-form", url: "https://www.youtube.com/watch?v=LMiDBZ54P9Q" },
  { title: "Video Project 2", tag: "Long-form", url: "https://www.youtube.com/watch?v=81CasDJm0lc" },
  { title: "Video Project 3", tag: "Long-form", url: "https://www.youtube.com/watch?v=khD2tmFBD_I" },
  { title: "Video Project 4", tag: "Short", url: "https://www.youtube.com/shorts/RTlX65xb7Pg" },
];

function youtubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{10,12})/);
  return m ? m[1] : null;
}

// ---- Thumbnails: crop YouTube's black bars so every card fills its frame ----
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => (img.naturalWidth > 120 ? resolve(img) : reject()); // 120px = "not found" placeholder
    img.onerror = reject;
    img.src = url;
  });
}

async function firstImage(urls) {
  for (const url of urls) {
    try { return await loadImage(url); } catch (e) {}
  }
  return null;
}

// Find the area of the image that isn't black bars
function contentBox(img) {
  const w = 160, h = Math.round((img.naturalHeight / img.naturalWidth) * w);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const dark = (x0, y0, x1, y1) => {
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        if (px[i] > 28 || px[i + 1] > 28 || px[i + 2] > 28) return false;
      }
    return true;
  };
  let l = 0, r = w, t = 0, b = h;
  while (l < w / 2 && dark(l, 0, l + 1, h)) l++;
  while (r > w / 2 && dark(r - 1, 0, r, h)) r--;
  while (t < h / 2 && dark(l, t, r, t + 1)) t++;
  while (b > h / 2 && dark(l, b - 1, r, b)) b--;
  if (r - l < w * 0.2 || b - t < h * 0.2) return null; // mostly black frame: leave it alone
  const k = img.naturalWidth / w;
  return { x: l * k, y: t * k, w: (r - l) * k, h: (b - t) * k };
}

async function enhanceThumb(card, id, isShort) {
  const base = "https://i.ytimg.com/vi/" + id + "/";
  const urls = (isShort ? ["oar2.jpg"] : []).concat(["maxresdefault.jpg", "hq720.jpg", "hqdefault.jpg"]);
  const img = await firstImage(urls.map((u) => base + u));
  if (!img) return;
  let src = img.src;
  let aspect = img.naturalWidth / img.naturalHeight;
  try {
    const box = contentBox(img);
    if (box) {
      const c = document.createElement("canvas");
      c.width = Math.round(box.w); c.height = Math.round(box.h);
      c.getContext("2d").drawImage(img, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);
      src = c.toDataURL("image/jpeg", 0.9);
      aspect = box.w / box.h;
    }
  } catch (e) {
    // Canvas blocked: use the uncropped image
  }
  const thumb = card.querySelector(".thumb");
  const bg = card.querySelector(".thumb-bg");
  thumb.src = src;
  const wide = aspect >= 1.6;
  thumb.classList.toggle("contain", !wide);
  bg.hidden = wide;
  if (!wide) bg.src = src;
}

function renderVideos() {
  const grid = document.getElementById("video-grid");
  grid.innerHTML = "";
  // 3 per row on desktop, except 4 (and 1-2) videos, which look better as 2 per row
  const n = VIDEOS.length;
  grid.classList.toggle("three-up", !(n === 4 || n <= 2));
  VIDEOS.forEach((v) => {
    const id = youtubeId(v.url);
    if (!id) return;
    const card = document.createElement("article");
    card.className = "card video-card";
    card.innerHTML = `
      <div class="video-frame">
        <button class="video-play" aria-label="Play: ${v.title}">
          <img class="thumb-bg" alt="" hidden />
          <img class="thumb" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" />
          <span class="play-btn"><svg class="icon" viewBox="0 0 24 24"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 20z"/></svg></span>
        </button>
      </div>
      <div class="video-body">
        <h3></h3>
        <div class="video-meta">
          <span class="badge">${v.tag}</span>
          <a href="${v.url}" target="_blank" rel="noopener">
            Watch on YouTube
            <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
          </a>
        </div>
      </div>`;
    card.querySelector("h3").textContent = v.title;
    card.querySelector(".video-play").addEventListener("click", (e) => {
      const frame = e.currentTarget.parentElement;
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=0&rel=0&iv_load_policy=3&playsinline=1"
        title="${v.title.replace(/"/g, "&quot;")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
    });
    grid.appendChild(card);
    enhanceThumb(card, id, v.url.includes("/shorts/"));
  });
}

// Theme toggle
function setupTheme() {
  const root = document.documentElement;
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current =
      root.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

// Reveal-on-scroll, staggered among siblings
const REVEAL_TARGETS = [
  ".section-head > *",
  ".video-card",
  ".page-card",
  ".skill",
  ".col-title",
  ".timeline-card",
  ".checklist li",
  ".edu",
  ".cta > *:not(.contact-grid)",
  ".contact-item",
  ".footer-inner > *",
].join(", ");

function setupReveal() {
  const els = [...document.querySelectorAll(REVEAL_TARGETS)];
  els.forEach((el) => el.classList.add("reveal"));
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.remove("reveal"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    // Stagger the elements that enter view together
    const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    visible.forEach((el, i) => {
      io.unobserve(el);
      const delay = Math.min(i, 6) * 90;
      el.style.transitionDelay = delay + "ms";
      el.classList.add("in");
      // Hand transitions back to the component (hover effects) once revealed
      setTimeout(() => {
        el.classList.remove("reveal", "in");
        el.style.transitionDelay = "";
      }, delay + 800);
    });
  }, { threshold: 0.1 });
  els.forEach((el) => io.observe(el));
}

// Hero name: each letter rolls upward through random capitals and settles, left to right.
// Resolves once the whole name has settled.
function setupMatrixName() {
  const el = document.querySelector(".matrix");
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const text = el.dataset.text;

  // Screen readers get the plain name; the animated copy is hidden from them
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = text;
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");

  // Each letter keeps its real (hidden) glyph for layout, with a reel of letters over it
  const chars = [...text].map((c) => {
    const ch = document.createElement("span");
    ch.className = "mx-ch";
    ch.innerHTML = '<span class="mx-final"></span>';
    ch.firstChild.textContent = c;
    visual.appendChild(ch);
    return ch;
  });
  el.replaceChildren(sr, visual);

  const duration = (i) => 900 + i * 130; // ms until letter i settles

  // Measure every capital so each slot only rolls letters that fit its width (no squeezing)
  const probe = document.createElement("span");
  probe.className = "mx-reel";
  probe.innerHTML = "<span></span><span></span>";
  probe.style.cssText = "visibility:hidden;right:auto";
  chars[0].appendChild(probe);
  const capWidths = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((L) => {
    probe.firstChild.textContent = L;
    return [L, probe.firstChild.getBoundingClientRect().width];
  });
  probe.remove();
  const narrowest = capWidths.reduce((a, b) => (b[1] < a[1] ? b : a))[0];

  const rolls = [];
  chars.forEach((ch, i) => {
    const c = ch.firstChild.textContent;
    if (c === " ") return;
    const slotW = ch.firstChild.getBoundingClientRect().width;
    const fits = capWidths.filter(([, w]) => w <= slotW * 1.04).map(([L]) => L);
    const pool = fits.length ? fits : [narrowest]; // "i", "l", "." roll the slimmest capital
    const steps = Math.round(duration(i) / 90); // letters that roll past before settling

    const reel = document.createElement("span");
    reel.className = "mx-reel";
    for (let k = 0; k < steps; k++) {
      const s = document.createElement("span");
      s.textContent = pool[Math.floor(Math.random() * pool.length)];
      reel.appendChild(s);
    }
    const last = document.createElement("span");
    last.textContent = c; // the real letter sits at the bottom of the reel
    reel.appendChild(last);
    ch.appendChild(reel);
    ch.classList.add("rolling");

    const rowH = last.getBoundingClientRect().height;
    const roll = reel.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(" + -steps * rowH + "px)" }],
      { duration: duration(i), easing: "cubic-bezier(.25, .6, .3, 1)", fill: "forwards" }
    );
    roll.onfinish = () => {
      reel.remove();
      ch.classList.replace("rolling", "settled");
    };
    rolls.push(roll.finished);
  });
  return Promise.all(rolls);
}

// Hero: cycle "I grow brands on ___" through platform names, starting once `ready` resolves
function setupRotator(ready) {
  const el = document.querySelector(".rotator");
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const words = el.dataset.words.split("|");

  // Screen readers keep the original phrase; the rotating copy is hidden from them
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = words[0];
  const box = document.createElement("span");
  box.className = "rot-box";
  box.setAttribute("aria-hidden", "true");
  const makeWord = (text) => {
    const w = document.createElement("span");
    w.className = "rot-word";
    w.textContent = text;
    return w;
  };
  let current = makeWord(words[0]);
  box.appendChild(current);
  el.replaceChildren(sr, box);

  // The box width follows the current word so the line doesn't leave a gap
  const fit = () => { box.style.width = current.getBoundingClientRect().width + "px"; };
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener("resize", fit);

  const easing = "cubic-bezier(.2, .7, .2, 1)";
  let i = 0;
  const swap = () => {
    i = (i + 1) % words.length;
    const next = makeWord(words[i]);
    next.classList.add("incoming");
    box.appendChild(next);
    box.style.width = next.getBoundingClientRect().width + "px";

    const old = current;
    old.animate(
      [{ transform: "none", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }],
      { duration: 450, easing, fill: "forwards" }
    );
    next.animate(
      [{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 450, easing }
    ).onfinish = () => {
      old.remove();
      next.classList.remove("incoming");
    };
    current = next;
  };
  ready.then(() => setTimeout(() => {
    swap();
    setInterval(swap, 2200);
  }, 1000));
}

document.getElementById("year").textContent = new Date().getFullYear();
renderVideos();
setupTheme();
setupReveal();
setupRotator(setupMatrixName());
