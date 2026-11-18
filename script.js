/* ==========================================================
   WEBSTUDIO — small interactions (vanilla JS, no libraries)
   ========================================================== */

document.documentElement.classList.remove("no-js");

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const navLinks = document.querySelectorAll(".nav__link");

  /* ---------- Nav background on scroll ---------- */
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const closeMenu = () => {
    links.classList.remove("is-open");
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) closeMenu(); });

  /* ---------- Highlight current section in nav ---------- */
  const sections = ["home", "projects", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = "home";
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
    // At the very bottom of the page, highlight Contact
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = "contact";
    navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${current}`));
  };
  setActive();
  window.addEventListener("scroll", setActive, { passive: true });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");

  // Stagger items that sit in the same group
  document.querySelectorAll(".projects, .services, .hero__content").forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => el.style.setProperty("--delay", `${i * 0.1}s`));
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Cursor glow on project cards ---------- */
  document.querySelectorAll(".project").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
