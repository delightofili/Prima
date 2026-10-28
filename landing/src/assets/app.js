/* Prima landing page. No libraries, no tracking, no network requests. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The mobile menu closes when a link is tapped
  document.querySelectorAll(".menu a").forEach((a) =>
    a.addEventListener("click", () => document.querySelector(".menu")?.removeAttribute("open"))
  );

  // Sections fade in as they come into view (everything is visible without JavaScript)
  const items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  }

  // The phone in the hero tells the whole story: signal drops, a patient is saved, signal returns, it uploads
  const phone = document.getElementById("phone");
  if (phone) {
    const pill = document.getElementById("ph-pill");
    const toast = document.getElementById("ph-toast");
    const card = document.getElementById("ph-card");
    const total = document.getElementById("ph-total");
    const today = document.getElementById("ph-today");
    const steps = [
      { wifi: "on", pill: "Synced", kind: "", toast: "", card: false, n: 128, t: 3 },
      { wifi: "off", pill: "Offline · 0 saved", kind: "is-offline", toast: "No signal. Keep working.", card: false, n: 128, t: 3 },
      { wifi: "off", pill: "Offline · 1 saved", kind: "is-offline", toast: "Saved on this phone", card: true, n: 129, t: 4 },
      { wifi: "on", pill: "Syncing…", kind: "is-busy", toast: "Back online. Uploading…", card: true, n: 129, t: 4 },
      { wifi: "on", pill: "Synced", kind: "", toast: "", card: false, n: 129, t: 4 },
    ];
    const show = (i) => {
      const s = steps[i];
      phone.dataset.step = String(i);
      phone.dataset.wifi = s.wifi;
      pill.textContent = s.pill;
      pill.className = "pill " + s.kind;
      toast.textContent = s.toast;
      toast.classList.toggle("on", !!s.toast && !s.card);
      card.classList.toggle("on", s.card);
      if (s.card && s.toast) { toast.classList.remove("on"); }
      total.textContent = String(s.n);
      today.textContent = String(s.t);
    };
    if (reduce) {
      show(2); // a still picture of the best moment
    } else {
      let i = 0;
      let timer = null;
      const play = () => { if (timer) return; timer = setInterval(() => { i = (i + 1) % steps.length; show(i); }, 2300); };
      const stop = () => { clearInterval(timer); timer = null; };
      show(0);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? play() : stop()))).observe(phone);
      } else play();
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
    }
  }

  // Countdown to the pilot, only if a launch time was set
  const box = document.getElementById("countdown");
  const launch = Date.parse(document.body.dataset.launch || "");
  if (box && Number.isFinite(launch)) {
    const units = Object.fromEntries([...box.querySelectorAll("[data-u]")].map((el) => [el.dataset.u, el]));
    const tick = () => {
      const left = Math.max(0, launch - Date.now());
      const s = Math.floor(left / 1000);
      units.d.textContent = String(Math.floor(s / 86400));
      units.h.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
      units.m.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      units.s.textContent = String(s % 60).padStart(2, "0");
      if (left === 0) { box.querySelector(".countdown-label").textContent = "The pilot is open"; clearInterval(t); }
    };
    box.classList.add("on");
    tick();
    const t = setInterval(tick, 1000);
  }
})();
