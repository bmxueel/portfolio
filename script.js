// ============================================================
// PORTFOLIO VIDEOS: edit this list to change the videos.
// Paste any YouTube link (watch, youtu.be or shorts) as `url`.
// ============================================================
const VIDEOS = [
  { title: "Video Project 1", tag: "Long-form", url: "https://www.youtube.com/watch?v=LMiDBZ54P9Q" },
  { title: "Video Project 2", tag: "Long-form", url: "https://www.youtube.com/watch?v=khD2tmFBD_I" },
  { title: "Video Project 3", tag: "Short", url: "https://www.youtube.com/shorts/RTlX65xb7Pg" },
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
          <span class="play-btn"><svg class="icon" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></span>
        </button>
      </div>
      <div class="video-body">
        <h3></h3>
        <div class="video-meta">
          <span class="badge">${v.tag}</span>
          <a href="${v.url}" target="_blank" rel="noopener">
            Watch on YouTube
            <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M7 17 17 7M7 7h10v10"/></svg>
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

// Toast + copy email
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2000);
}

function setupCopy() {
  document.getElementById("copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("bm.xueel@gmail.com");
      toast("Email copied to clipboard");
    } catch (e) {
      toast("bm.xueel@gmail.com");
    }
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

document.getElementById("year").textContent = new Date().getFullYear();
renderVideos();
setupTheme();
setupCopy();
setupReveal();
