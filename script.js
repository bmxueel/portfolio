// ============================================================
// PORTFOLIO VIDEOS: edit this list to change the videos.
// Paste any YouTube link (watch, youtu.be or shorts) as `url`.
// ============================================================
const VIDEOS = [
  { title: "Video Project 1", tag: "Video edit", url: "https://www.youtube.com/watch?v=8of5w7RgcTc" },
  { title: "Video Project 2", tag: "Video edit", url: "https://www.youtube.com/watch?v=50VNCymT-Cs" },
  { title: "Video Project 3", tag: "Video edit", url: "https://www.youtube.com/watch?v=xEALTVLxrDw" },
  { title: "Video Project 4", tag: "Video edit", url: "https://www.youtube.com/watch?v=YxJjFjP0cr" },
];

function youtubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{10,12})/);
  return m ? m[1] : null;
}

function renderVideos() {
  const grid = document.getElementById("video-grid");
  grid.innerHTML = "";
  VIDEOS.forEach((v) => {
    const id = youtubeId(v.url);
    if (!id) return;
    const card = document.createElement("article");
    card.className = "card video-card";
    card.innerHTML = `
      <div class="video-frame">
        <button class="video-play" aria-label="Play: ${v.title}">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" />
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
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
        title="${v.title.replace(/"/g, "&quot;")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
    });
    grid.appendChild(card);
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
