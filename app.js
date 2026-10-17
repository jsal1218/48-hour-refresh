/* ==========================================================================
   48-Hour Refresh: app config
   --------------------------------------------------------------------------
   FORM_ENDPOINT: paste a free form endpoint here to get submissions emailed
   to you automatically. Leave "" to use the mailto: fallback only.
     Formspree (free):  "https://formspree.io/f/XXXXXXXX"
     FormSubmit (free): "https://formsubmit.co/ajax/you@example.com"
   CONTACT_EMAIL: the inbox the mailto: fallback addresses requests to.
   ========================================================================== */
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = ""; // TODO(Jordan): set your business email, e.g. "hello@yourdomain.com"
/* ========================================================================== */

const PRICES = {
  starter: { label: "Starter", min: 250, max: 250, note: "one-time", form: "Starter (~$250)" },
  motion:  { label: "Refresh + Motion", min: 400, max: 400, note: "one-time", form: "Refresh + Motion (~$400)" },
  always:  { label: "Always Fresh", min: 750, max: 1200, note: "per month", form: "Always Fresh ($750–$1,200/mo)" },
};
const RUSH = 0.30;
const SCREENS = ["home", "packages", "work", "faq", "request"];
const STORE_KEY = "48hr.requests";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => "$" + Math.round(n).toLocaleString("en-US");

/* ---------- Theme ---------- */
const root = document.documentElement;
const savedTheme = localStorage.getItem("48hr.theme");
if (savedTheme) root.dataset.theme = savedTheme;
function isDark() {
  return root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}
function syncThemeColor() {
  const c = isDark() ? "#0f0d17" : "#f7f5fb";
  $$('meta[name="theme-color"]').forEach(m => { m.setAttribute("content", c); m.removeAttribute("media"); });
}
$("#themeBtn").addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  localStorage.setItem("48hr.theme", root.dataset.theme);
  syncThemeColor();
});
if (savedTheme) syncThemeColor();

/* ---------- Router ---------- */
let current = null;
function show(name, opts = {}) {
  if (!SCREENS.includes(name)) name = "home";
  const back = current && SCREENS.indexOf(name) < SCREENS.indexOf(current);
  $$(".screen").forEach(s => { s.hidden = s.id !== "screen-" + name; });
  const el = $("#screen-" + name);
  el.classList.toggle("back", !!back);
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  $$("[data-go]").forEach(b => b.classList.toggle("active", b.dataset.go === name && (b.classList.contains("tab") || b.parentElement.classList.contains("topnav"))));
  document.title = (name === "home" ? "" : el.dataset.title + " · ") + "48-Hour Refresh";
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  current = name;
  if (location.hash.slice(1) !== name) history.pushState(null, "", "#" + name);
}
window.addEventListener("popstate", () => show(location.hash.slice(1) || "home"));
document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if (!b) return;
  e.preventDefault();
  if (b.dataset.sample) { $("#f-sample").checked = true; $("#f-pkg").value = "Free sample only"; }
  show(b.dataset.go);
});

/* ---------- Estimator ---------- */
function estimate() {
  const key = $('input[name="estPkg"]:checked').value;
  const p = PRICES[key], m = $("#estRush").checked ? 1 + RUSH : 1;
  $("#estPrice").textContent = p.min === p.max ? fmt(p.min * m) : `${fmt(p.min * m)}–${fmt(p.max * m)}`;
  $("#estNote").textContent = p.note + ($("#estRush").checked ? " · includes 24-hour rush (+30%)" : " · 48-hour delivery");
  return { key, p };
}
$$('input[name="estPkg"], #estRush').forEach(i => i.addEventListener("change", estimate));
$$("[data-pick]").forEach(b => b.addEventListener("click", () => {
  $(`input[name="estPkg"][value="${b.dataset.pick}"]`).checked = true;
  estimate();
  $("#estimator").scrollIntoView({ behavior: "smooth", block: "start" });
}));
$("#estRequest").addEventListener("click", () => {
  const { p } = estimate();
  $("#f-pkg").value = p.form;
  $(`input[name="rush"][value="${$("#estRush").checked ? "Yes" : "No"}"]`).checked = true;
  show("request");
});
estimate();

/* ---------- Requests ---------- */
const form = $("#reqForm");
const getSaved = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } };
function renderSaved() {
  const list = getSaved();
  $("#savedWrap").hidden = !list.length;
  $("#savedList").innerHTML = "";
  list.slice().reverse().forEach(r => {
    const li = document.createElement("li");
    const strong = document.createElement("strong"); strong.textContent = r.business;
    const small = document.createElement("small");
    small.textContent = `${r.package} · rush: ${r.rush} · ${new Date(r.submittedAt).toLocaleString()}${r.delivered ? " · sent" : ""}`;
    li.append(strong, small); $("#savedList").append(li);
  });
}
$("#clearSaved").addEventListener("click", () => { localStorage.removeItem(STORE_KEY); renderSaved(); toast("Saved requests cleared"); });

function collect() {
  const d = Object.fromEntries(new FormData(form).entries());
  d.freeSample = $("#f-sample").checked ? "Yes" : "No";
  Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
  return d;
}
function validate(d) {
  let ok = true;
  $$("[required]", form).forEach(i => {
    const bad = !i.value.trim() || (i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value.trim()));
    i.classList.toggle("invalid", bad);
    if (bad && ok) { ok = false; i.focus(); }
  });
  $("#formError").hidden = ok;
  $("#formError").textContent = ok ? "" : "Please fill in the highlighted fields (a valid email is required).";
  return ok;
}
function bodyText(d) {
  return [
    "New 48-Hour Refresh request",
    "",
    `Name: ${d.name}`,
    `Business: ${d.business}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone || "(not given)"}`,
    `Business type: ${d.businessType}`,
    `Package interest: ${d.package}`,
    `24-hour rush (+30%): ${d.rush}`,
    `Free sample first: ${d.freeSample}`,
    "",
    "Message:",
    d.message,
  ].join("\n");
}
function mailtoUrl(d) {
  const subject = `${d.freeSample === "Yes" ? "Free sample request" : "Request"}: ${d.business}`;
  return `mailto:${encodeURIComponent(CONTACT_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText(d))}`;
}
let lastText = "";
form.addEventListener("input", e => e.target.classList.remove("invalid"));
form.addEventListener("submit", async e => {
  e.preventDefault();
  const d = collect();
  if (!validate(d)) return;
  const rec = { ...d, submittedAt: new Date().toISOString(), delivered: false };
  lastText = bodyText(d);
  const btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "Sending…";
  let sent = false;
  if (FORM_ENDPOINT && navigator.onLine) {
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...d, _subject: `48-Hour Refresh request: ${d.business}`, _replyto: d.email }),
      });
      sent = res.ok;
    } catch { sent = false; }
  }
  rec.delivered = sent;
  const list = getSaved(); list.push(rec); localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-25)));
  btn.disabled = false; btn.textContent = "Send request";
  const url = mailtoUrl(d);
  $("#mailAgain").href = url;
  if (sent) {
    $("#successText").textContent = "Thanks! Your request was sent. We'll reply within one business day. A copy is saved on this device.";
  } else {
    $("#successText").textContent = "Your email app should open with your request filled in. Just tap send. A copy is saved on this device.";
    location.href = url;
  }
  form.hidden = true; $("#success").hidden = false; renderSaved();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#copyReq").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(lastText); toast("Request copied"); }
  catch { toast("Couldn't copy on this device"); }
});
$("#newReq").addEventListener("click", () => { form.reset(); form.hidden = false; $("#success").hidden = true; });
renderSaved();

/* ---------- Toast ---------- */
let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200); }

/* ---------- Install prompt ---------- */
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let deferred = null;
const dismissed = () => localStorage.getItem("48hr.installDismissed") === "1";
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferred = e;
  if (!dismissed()) $("#installCard").hidden = false;
});
if (isIOS && !standalone && !dismissed()) {
  $("#installCard").hidden = false;
  $("#installText").textContent = "Tap Share, then “Add to Home Screen”.";
  $("#installBtn").textContent = "How?";
}
$("#installBtn").addEventListener("click", async () => {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; $("#installCard").hidden = true; }
  else $("#iosSheet").hidden = false;
});
$("#installClose").addEventListener("click", () => { $("#installCard").hidden = true; localStorage.setItem("48hr.installDismissed", "1"); });
$("#iosClose").addEventListener("click", () => $("#iosSheet").hidden = true);
$("#iosSheet").addEventListener("click", e => { if (e.target.id === "iosSheet") e.currentTarget.hidden = true; });
window.addEventListener("appinstalled", () => { $("#installCard").hidden = true; toast("Installed! Find it on your home screen."); });

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

show(location.hash.slice(1) || "home", { keepScroll: true });
