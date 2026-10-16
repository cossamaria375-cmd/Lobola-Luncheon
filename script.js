// ============================================================
// SETTINGS — edit these in one place
// ============================================================

// The big day (South African time = +02:00).
// Drives the countdown AND the date line on the home page.
const WEDDING_DATE = new Date("2026-12-19T13:00:00+02:00");

// Local song file — must sit in the SAME folder as index.html
const SONG_SRC = "song.mp3";

const SONG_VOLUME = 0.8;   // 0 to 1
const FADE_IN_SECS = 2.5;  // gentle fade-in after entering

const WHATSAPP_NUMBER = "27646480013";   // bride's WhatsApp, international format

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

console.log("Invitation script loaded \u2714");  // check for this in the console (F12)

function addShake(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}


// ============================================================
// COUNTDOWN
// ============================================================

let cdTimer = null;

function pad(n) {
  return String(n).padStart(2, "0");
}

function setCell(id, val) {

  const el = document.getElementById(id);
  if (!el) return;

  const text = pad(val);

  if (el.textContent !== text) {
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }

}

function runCountdown() {

  let diff = WEDDING_DATE.getTime() - Date.now();
  const done = diff <= 0;

  if (done) diff = 0;

  const totalSecs = Math.floor(diff / 1000);

  setCell("cdDays",  Math.floor(totalSecs / 86400));
  setCell("cdHours", Math.floor((totalSecs % 86400) / 3600));
  setCell("cdMins",  Math.floor((totalSecs % 3600) / 60));
  setCell("cdSecs",  totalSecs % 60);

  if (done) {
    const label = $("#countLabel");
    if (label) label.textContent = "Today we celebrate \u{1F9E1}";
    if (cdTimer) clearInterval(cdTimer);
  }

}

cdTimer = setInterval(runCountdown, 1000);
runCountdown();


// Fill the home-page date line from WEDDING_DATE too
(function fillDateLine() {

  const el = $(".js-date");
  if (!el || isNaN(WEDDING_DATE.getTime())) return;

  const day   = WEDDING_DATE.getDate();
  const month = WEDDING_DATE.toLocaleString("en-GB", { month: "long" });
  const year  = WEDDING_DATE.getFullYear();
  const time  = pad(WEDDING_DATE.getHours()) + "H" + pad(WEDDING_DATE.getMinutes());

  el.textContent = day + " " + month + " " + year + " \u2022 " + time;

})();


// ============================================================
// MUSIC — local file, starts inside the "Open" tap gesture
// ============================================================

let audioEl = null;
let musicOn = false;

(function initMusic() {

  try {

    audioEl = document.getElementById("bgm");
    if (!audioEl) return;   // audio tag missing — button still works, just silent

    audioEl.src = SONG_SRC;
    audioEl.volume = SONG_VOLUME;

    audioEl.addEventListener("play", () => {
      musicOn = true;
      setMusicUI(true);
    });

    audioEl.addEventListener("pause", () => {
      musicOn = false;
      setMusicUI(false);
    });

  } catch (err) {
    audioEl = null;
  }

})();

function fadeInAudio() {

  if (!audioEl) return;

  const steps = 40;
  let i = 0;

  audioEl.volume = 0;

  const timer = setInterval(() => {
    i++;
    audioEl.volume = Math.min(SONG_VOLUME, SONG_VOLUME * (i / steps));
    if (i >= steps) clearInterval(timer);
  }, (FADE_IN_SECS * 1000) / steps);

}

function startMusic() {

  try {

    if (!audioEl) return;

    const attempt = audioEl.play();

    if (attempt && attempt.catch) {
      attempt
        .then(() => fadeInAudio())
        .catch(() => {
          // blocked or file missing — floating button picks it up later
        });
    } else {
      fadeInAudio();
    }

  } catch (err) {}

}

function toggleMusic() {

  try {
    if (!audioEl) return;
    if (musicOn) {
      audioEl.pause();
    } else {
      audioEl.play().catch(() => {});
    }
  } catch (err) {}

}

function setMusicUI(on) {

  const b = $("#musicBtn");
  if (!b) return;

  b.classList.toggle("playing", on);
  b.classList.remove("attract");
  b.setAttribute("aria-label", on ? "Pause music" : "Play music");

}


// ============================================================
// WELCOME → ENVELOPE → SITE
// (works with the new welcome screen AND the old password screen)
// ============================================================

let opening = false;

function openInvitation() {

  if (opening) return;
  opening = true;

  startMusic(); // fired inside the tap gesture → browsers allow sound

  const welcome = $("#welcome-screen");
  const lock    = $("#lock-screen");
  const scene   = $("#envelope-scene");
  const website = $("#website");

  // hide whichever entry screen exists
  if (welcome) welcome.style.display = "none";
  if (lock)    lock.style.display = "none";

  // label whichever entry button exists
  const btn = document.querySelector(".enter-btn") || document.querySelector(".lock-box button");
  if (btn) {
    btn.textContent = "Opening\u2026";
    btn.disabled = true;
  }

  // no envelope in the HTML? skip straight to the site
  if (!scene) {
    if (website) website.style.display = "block";
    showPage("home");
    return;
  }

  scene.style.display = "flex";

  requestAnimationFrame(() =>
    requestAnimationFrame(() => scene.classList.add("open"))
  );

  setTimeout(() => {

    scene.style.display = "none";
    if (website) website.style.display = "block";
    showPage("home");

    // if playback didn't start, invite a tap on the music button
    setTimeout(() => {
      if (!musicOn) {
        const mb = $("#musicBtn");
        if (mb) mb.classList.add("attract");
      }
    }, 1200);

  }, 2600);

}

// Compatibility alias — old HTML files call enterInvitation()
function enterInvitation() {
  openInvitation();
}

// make sure both names exist globally no matter what
window.openInvitation = openInvitation;
window.enterInvitation = enterInvitation;

// also bind the button programmatically (belt and braces)
(function bindEnter() {
  const btn = document.querySelector(".enter-btn");
  if (btn) btn.addEventListener("click", openInvitation);
})();


// ============================================================
// PAGE SWITCHING
// ============================================================

function showPage(pageName) {

  $$(".page").forEach((page) => page.classList.remove("active"));

  const target = document.getElementById(pageName);
  if (target) target.classList.add("active");

  $$("[data-page]").forEach((btn) => {
    const on = btn.dataset.page === pageName;
    btn.classList.toggle("nav-active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });

  closeLightbox();
  window.scrollTo(0, 0);

}


// ============================================================
// RSVP → WHATSAPP
// ============================================================

let guests = 1;
let attending = "yes";

function stepGuests(dir) {

  guests = Math.min(10, Math.max(1, guests + dir));

  const el = $("#guestCount");
  if (el) el.textContent = guests;

}

function setAttending(value, btn) {

  attending = value;

  $$(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));

}

function sendRSVP() {

  const nameInput = $("#rsvpName");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  const card = $("#rsvpCard");
  const err  = $("#rsvpError");

  if (!name) {
    if (err) err.textContent = "Please enter your name first.";
    addShake(card);
    nameInput.focus();
    return;
  }

  if (err) err.textContent = "";

  const reply = attending === "yes"
    ? "Yes, joyfully accepts \u{1F9E1}"
    : "No, with regret";

  const msg =
    "Lobola Luncheon \u2014 19 December 2026\n\n" +
    "Name: " + name + "\n" +
    "Guests: " + guests + "\n" +
    "Attending: " + reply;

  window.open(
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg),
    "_blank"
  );

}


// ============================================================
// LIGHTBOX
// ============================================================

let lightbox = null;
let lbImg = null;
let lbCap = null;
let lbFig = null;
let lbIndex = 0;

const slides = [];

(function initLightbox() {

  lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  lbImg = document.getElementById("lbImg");
  lbCap = document.getElementById("lbCap");
  lbFig = lightbox.querySelector(".lb-figure");

  $$(".gallery-photo").forEach((fig) => {

    const img = fig.querySelector("img");
    if (!img) return;

    slides.push({
      src: img.getAttribute("src"),
      cap: img.dataset.cap || img.alt || ""
    });

    img.addEventListener("click", () => {
      openLightbox(slides.findIndex((s) => s.src === img.getAttribute("src")));
    });

  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

})();

function renderSlide() {

  if (!slides.length || !lbImg) return;

  const s = slides[lbIndex];
  lbImg.src = s.src;
  lbImg.alt = s.cap;
  if (lbCap) lbCap.textContent = s.cap;

  if (lbFig) {
    lbFig.classList.remove("swap");
    void lbFig.offsetWidth;
    lbFig.classList.add("swap");
  }

}

function openLightbox(i) {

  if (!slides.length) return;

  lbIndex = (i + slides.length) % slides.length;
  renderSlide();

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";

}

function closeLightbox() {

  if (!lightbox || !lightbox.classList.contains("open")) return;

  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";

}

function lbStep(dir) {
  lbIndex = (lbIndex + dir + slides.length) % slides.length;
  renderSlide();
}

document.addEventListener("keydown", (e) => {

  if (!lightbox || !lightbox.classList.contains("open")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") lbStep(1);
  if (e.key === "ArrowLeft") lbStep(-1);

});


// ============================================================
// SCROLL-REVEAL
// ============================================================

(function initReveal() {

  const items = $$(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });

  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach((el) => io.observe(el));

})();


// ============================================================
// BUTTON RIPPLES
// ============================================================

 $$(".btn").forEach((el) => {

  el.addEventListener("pointerdown", (e) => {

    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 1.15;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = d + "px";
    ripple.style.left = (e.clientX - rect.left - d / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - d / 2) + "px";

    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());

  });

});