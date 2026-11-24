/* =====================================================================
   tv.js — Guide TV interactif (EPG) + lecteur vidéo de démonstration
   ---------------------------------------------------------------------
   GUIDE TV : les programmes du jour sont générés automatiquement pour chaque
   chaîne (fonction pseudo-aléatoire « graine » = numéro de chaîne + date :
   le programme est le même pour tout le monde et change chaque jour).
   Le programme « en cours » reprend celui saisi dans l'admin.
   LECTEUR : animation dessinée en temps réel dans un <canvas> (aucune vidéo
   protégée par des droits), avec commandes play/pause, chaîne précédente/suivante,
   plein écran, raccourcis clavier.
   ===================================================================== */
(function () {
  const TITLES = {
    "Sport": ["Le Grand Match", "Magazine Sport", "Résumé de la journée", "Direct : Coupe régionale", "Le Débrief", "Sports extrêmes"],
    "Cinéma": ["Film : Nuit Blanche", "Film : Les Voyageurs", "Ciné-Club", "Film : L'Héritage", "Bandes-annonces", "Film : Le Phare"],
    "Séries": ["Code Bleu", "Le Cercle", "Épisode inédit", "Marathon séries", "Les Inséparables"],
    "Enfants": ["Dessins animés", "Petits Explorateurs", "Atelier créatif", "Contes du soir"],
    "Actualités": ["Le Journal", "L'Édition du soir", "Débat du jour", "Flash info", "Météo"],
    "Documentaire": ["Planète sauvage", "Grands bâtisseurs", "Histoires vraies", "Au cœur des volcans"],
    "Musique": ["Top 50", "Clips non-stop", "Concert privé", "Découvertes"],
    "Lifestyle": ["Maison & Déco", "Voyage gourmand", "Le Marché", "Bien-être"],
    "Gaming": ["Let's Play", "Rétro Gaming", "Gaming News", "Speedrun"]
  };
  const DESC = c => `Programme du jour sur ${c.name} (${c.cat}).`;
  const W = 200;                 // largeur d'une heure dans la grille (px)
  const data = hayaLoad();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayKey = today.getFullYear() * 1000 + Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 864e5);

  // Générateur pseudo-aléatoire déterministe (mulberry32)
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Programmes de la journée pour une chaîne : [{start, end, title}]
  const cache = {};
  function schedule(c) {
    if (cache[c.id]) return cache[c.id];
    const r = rng(c.id * 7919 + dayKey), list = TITLES[c.cat] || ["Émission", "Magazine", "Programme"];
    const out = []; let t = 0;
    while (t < 24 * 60) {
      const dur = [30, 45, 60, 60, 90, 120][Math.floor(r() * 6)];
      out.push({ start: t, end: Math.min(24 * 60, t + dur), title: list[Math.floor(r() * list.length)] });
      t += dur;
    }
    const now = minutesNow(), cur = out.find(p => p.start <= now && now < p.end);
    if (cur && c.program) cur.title = c.program;
    return (cache[c.id] = out);
  }
  const minutesNow = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  window.hayaCurrentProgram = c => { const now = minutesNow(); return schedule(c).find(p => p.start <= now && now < p.end); };

  // ---------- Guide TV ----------
  const grid = document.getElementById("epg");
  function drawEpg() {
    if (!grid) return;
    const now = minutesNow(), from = Math.max(0, Math.floor(now / 60) * 60 - 60), to = Math.min(24 * 60, from + 6 * 60);
    const x = m => (m - from) / 60 * W;
    const hours = []; for (let h = from; h < to; h += 60) hours.push(h);
    const reminders = getReminders();
    grid.innerHTML = `
      <div class="epg-row epg-head"><div class="epg-ch">Aujourd'hui</div><div class="epg-track" style="width:${(to - from) / 60 * W}px">
        ${hours.map(h => `<span class="epg-hour" style="left:${x(h)}px">${hhmm(h)}</span>`).join("")}</div></div>
      ${data.channels.map(c => `<div class="epg-row"><button type="button" class="epg-ch" data-play="${c.id}" title="Aperçu de ${esc(c.name)}"><span aria-hidden="true">${esc(c.icon)}</span>${esc(c.name)}</button>
        <div class="epg-track" style="width:${(to - from) / 60 * W}px">
          ${schedule(c).filter(p => p.end > from && p.start < to).map(p => {
            const l = x(Math.max(p.start, from)), w = x(Math.min(p.end, to)) - l, live = p.start <= now && now < p.end, past = p.end <= now;
            const key = `${c.id}-${p.start}`;
            return `<button type="button" class="epg-prog ${live ? "onair" : ""} ${past ? "past" : ""}" style="left:${l}px;width:${w - 4}px" data-ch="${c.id}" data-start="${p.start}">
              <b>${reminders.includes(key) ? "🔔 " : ""}${esc(p.title)}</b><small>${hhmm(p.start)} – ${hhmm(p.end)}</small></button>`;
          }).join("")}
        </div></div>`).join("")}
      <div class="epg-now" style="left:calc(var(--epg-ch) + ${x(now)}px)" aria-hidden="true"><span>${hhmm(now)}</span></div>`;
    // Faire défiler la grille pour montrer « maintenant »
    grid.scrollLeft = Math.max(0, x(now) - 120);
  }
  const getReminders = () => { try { return JSON.parse(localStorage.getItem("haya-reminders")) || []; } catch (e) { return []; } };
  const setReminders = r => { try { localStorage.setItem("haya-reminders", JSON.stringify(r)); } catch (e) {} };

  // Fiche d'un programme (clic dans la grille)
  const pop = document.getElementById("epg-pop");
  function openProgram(chId, start) {
    const c = data.channels.find(x => x.id == chId), p = schedule(c).find(x => x.start == start);
    const now = minutesNow(), live = p.start <= now && now < p.end, future = p.start > now, key = `${c.id}-${p.start}`;
    const has = getReminders().includes(key);
    pop.innerHTML = `<button type="button" class="modal-x" data-close-pop aria-label="Fermer">✕</button>
      <span class="eyebrow">${esc(c.icon)} ${esc(c.name)} · ${esc(c.cat)}</span>
      <h3 style="margin:10px 0 4px;font-size:1.3rem">${esc(p.title)}</h3>
      <p class="muted" style="margin:0 0 10px">${hhmm(p.start)} – ${hhmm(p.end)} · ${p.end - p.start} min ${live ? '· <span class="live" style="font-size:.65rem">EN DIRECT</span>' : ""}</p>
      <p style="margin:0 0 16px;color:var(--muted)">${esc(DESC(c))}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${live ? `<button type="button" class="btn small" data-play="${c.id}">▶ Voir l'aperçu</button>` : ""}
        ${future ? `<button type="button" class="btn small ghost" data-remind="${key}">${has ? "🔕 Retirer le rappel" : "🔔 Me rappeler"}</button>` : ""}
        ${!live && !future ? `<span class="muted" style="font-size:.85rem">⏪ Disponible en replay (selon votre formule)</span>` : ""}
      </div>`;
    pop.hidden = false;
  }
  if (grid) {
    grid.addEventListener("click", e => {
      const b = e.target.closest(".epg-prog"); if (b) openProgram(b.dataset.ch, b.dataset.start);
    });
    document.addEventListener("click", e => {
      if (e.target.closest("[data-close-pop]")) pop.hidden = true;
      const r = e.target.closest("[data-remind]");
      if (r) {
        const list = getReminders(), k = r.dataset.remind, i = list.indexOf(k);
        i >= 0 ? list.splice(i, 1) : list.push(k); setReminders(list);
        r.textContent = i >= 0 ? "🔔 Me rappeler" : "🔕 Retirer le rappel"; drawEpg();
      }
    });
    drawEpg(); setInterval(drawEpg, 60000);
    // Rappels : notification à l'écran quand un programme commence
    setInterval(() => {
      const now = minutesNow();
      getReminders().forEach(k => { const [cid, s] = k.split("-").map(Number);
        if (s === now) { const c = data.channels.find(x => x.id === cid); if (c && window.hayaToast) hayaToast(`🔔 « ${schedule(c).find(p => p.start === s).title} » commence sur ${c.name}`); } });
    }, 60000);
  }

  // ---------- Lecteur vidéo de démonstration ----------
  const pm = document.getElementById("player");
  if (!pm) return;
  const canvas = pm.querySelector("canvas"), ctx = canvas.getContext("2d");
  let idx = 0, playing = true, raf = 0, t0 = performance.now(), muted = true;
  const hueOf = cat => ({ "Sport": 140, "Cinéma": 280, "Séries": 330, "Enfants": 45, "Actualités": 210, "Documentaire": 100, "Musique": 300, "Lifestyle": 20, "Gaming": 190 }[cat] ?? 250);

  function frame(now) {
    const c = data.channels[idx], w = canvas.width, h = canvas.height, t = (now - t0) / 1000, hue = hueOf(c.cat);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue},70%,${18 + 6 * Math.sin(t / 3)}%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360},65%,12%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {                  // halos lumineux animés
      const x = (Math.sin(t * .3 + i * 1.7) * .5 + .5) * w, y = (Math.cos(t * .25 + i * 2.3) * .5 + .5) * h, r = 40 + (i % 5) * 26;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `hsla(${(hue + i * 20) % 360},90%,65%,.35)`); rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(h * .22)}px system-ui, "Segoe UI Emoji", sans-serif`; ctx.fillText(c.icon, w / 2, h * .4 + Math.sin(t * 2) * 6);
    ctx.font = `800 ${Math.round(h * .07)}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillText(c.name, w / 2, h * .54);
    if (playing) raf = requestAnimationFrame(frame);
  }
  function load(i) {
    idx = (i + data.channels.length) % data.channels.length;
    const c = data.channels[idx], p = hayaCurrentProgram(c), now = minutesNow();
    pm.querySelector(".pl-ch").textContent = `${c.icon} ${c.name} · ${c.cat}`;
    pm.querySelector(".pl-title").textContent = p ? p.title : c.program;
    pm.querySelector(".pl-time").textContent = p ? `${hhmm(p.start)} – ${hhmm(p.end)}` : "";
    pm.querySelector(".pl-bar i").style.width = p ? Math.round((now - p.start) / (p.end - p.start) * 100) + "%" : "50%";
    cancelAnimationFrame(raf); playing = true; updateButtons(); raf = requestAnimationFrame(frame);
  }
  function updateButtons() {
    pm.querySelector("[data-pl=play]").textContent = playing ? "⏸" : "▶";
    pm.querySelector("[data-pl=play]").setAttribute("aria-label", playing ? "Pause" : "Lecture");
    pm.querySelector("[data-pl=mute]").textContent = muted ? "🔇" : "🔊";
  }
  window.hayaPlay = function (chId) {
    const i = data.channels.findIndex(c => c.id == chId); if (i < 0) return;
    pop && (pop.hidden = true);
    pm.hidden = false; document.body.style.overflow = "hidden"; load(i);
    pm.querySelector("[data-pl=play]").focus();
  };
  function closePlayer() { cancelAnimationFrame(raf); pm.hidden = true; document.body.style.overflow = ""; if (document.fullscreenElement) document.exitFullscreen(); }
  pm.addEventListener("click", e => {
    const b = e.target.closest("[data-pl]"); if (e.target === pm) return closePlayer(); if (!b) return;
    const a = b.dataset.pl;
    if (a === "close") closePlayer();
    if (a === "play") { playing = !playing; updateButtons(); if (playing) raf = requestAnimationFrame(frame); }
    if (a === "prev") load(idx - 1);
    if (a === "next") load(idx + 1);
    if (a === "mute") { muted = !muted; updateButtons(); }
    if (a === "full") { const box = pm.querySelector(".pl-box"); document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen && box.requestFullscreen(); }
  });
  document.addEventListener("keydown", e => {
    if (pm.hidden || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "Escape") closePlayer();
    if (e.key === " ") { e.preventDefault(); pm.querySelector("[data-pl=play]").click(); }
    if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); load(idx + 1); }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); load(idx - 1); }
    if (e.key.toLowerCase() === "f") pm.querySelector("[data-pl=full]").click();
    if (e.key.toLowerCase() === "m") pm.querySelector("[data-pl=mute]").click();
  });
  // Tout élément avec data-play="id" ouvre le lecteur (cartes de chaînes, guide TV…)
  document.addEventListener("click", e => { const b = e.target.closest("[data-play]"); if (b && !b.closest("#player")) hayaPlay(b.dataset.play); });
  document.addEventListener("keydown", e => { const b = e.target.closest && e.target.closest(".ch[data-play]"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); hayaPlay(b.dataset.play); } });
})();
