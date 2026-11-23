/* Capa interactiva del skin (Guaitipán · San Agustín). Se carga desde el tour con un CustomBehaviour de 3DVista
   que deja el reproductor en window.TDVTour. Funciona también sin él (modo reducido: insignia + pasaporte).
   - Insignia de progreso: sellos (del pasaporte) y panoramas explorados.
   - Aviso al cambiar de panorama: zona, título y si hay un sello escondido.
   - Panel «Explorar»: zonas y panoramas, con los ya visitados marcados; un toque te lleva allí.
   - Pasaporte en ventana propia. Atajos: P pasaporte · E explorar · Esc cerrar. */
(function () {
  if (window.__skinFx) return; window.__skinFx = true;
  const D = window.TOUR_DATA || { medias: [], zonas: [], totalSellos: 7, claveSellos: "pasaporte-tour-v1", pasaporte: "pasaporte/index.html" };
  const KV = "skinfx-visitados-" + (D.id || "tour");
  const C = { almagre: "#9E3B26", ocre: "#C99A2E", carbon: "#1E1B18", hueso: "#EDE6D6", papel: "#F3EDE0" };
  const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TXT = {
    es: { pas: "PASAPORTE", exp: "Explorar", abrir: "Abrir", explorados: "explorados", titulo: "Explorar el recorrido",
          tocar: "Toca un lugar para ir allí.", menu: "Usa el menú del tour para moverte.", leyenda: "◉ = hay un sello · ✓ = ya lo visitaste",
          tienes: "✓ Ya tienes el sello {n} de este lugar.", hay: "Aquí hay un sello escondido: busca el medallón {n}.",
          gira: "Gira la estatua con el dedo o el ratón.", cerrar: "Cerrar", tExp: "Explorar (E)", tPas: "Pasaporte (P)" },
    en: { pas: "PASSPORT", exp: "Explore", abrir: "Open", explorados: "explored", titulo: "Explore the tour",
          tocar: "Tap a place to go there.", menu: "Use the tour menu to move around.", leyenda: "◉ = there is a stamp · ✓ = already visited",
          tienes: "✓ You already have stamp {n} from this place.", hay: "There is a hidden stamp here: look for medallion {n}.",
          gira: "Rotate the statue with your finger or mouse.", cerrar: "Close", tExp: "Explore (E)", tPas: "Passport (P)" }
  };
  const idioma = () => { try { return (window.tour && window.tour.getLocale && window.tour.getLocale() || "es").slice(0, 2); } catch (e) { return "es"; } };
  const T = k => (TXT[idioma()] || TXT.es)[k];
  const tit = m => (idioma() === "en" && m.titulo_en) || m.titulo;
  const zon = z => (idioma() === "en" && D.zonas_en && D.zonas_en[z]) || z;

  /* ---------- estilos ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .sfx{font-family:Montserrat,Arial,sans-serif;position:fixed;z-index:2147483000;color:${C.hueso}}
  .sfx *{box-sizing:border-box}
  #sfx-badge{top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:7px 8px 7px 14px;
    background:rgba(30,27,24,.78);backdrop-filter:blur(6px);border:1px solid rgba(201,154,46,.55);border-radius:999px;
    box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:default;user-select:none;animation:sfx-in .6s ease both}
  #sfx-badge .t{font-family:Cinzel,Georgia,serif;font-weight:800;font-size:12px;letter-spacing:.08em;color:${C.ocre};white-space:nowrap}
  #sfx-badge .dots{display:flex;gap:4px}
  #sfx-badge .dots i{width:9px;height:9px;border-radius:50%;border:1.5px solid ${C.ocre};display:block;transition:.3s}
  #sfx-badge .dots i.on{background:${C.ocre};box-shadow:0 0 8px ${C.ocre}}
  #sfx-badge .exp{font-size:11px;opacity:.85;white-space:nowrap}
  #sfx-badge button{font:600 12px Montserrat,Arial,sans-serif;border:0;border-radius:999px;padding:7px 12px;cursor:pointer;
    background:${C.almagre};color:${C.hueso};transition:transform .15s,box-shadow .15s}
  #sfx-badge button.sec{background:transparent;border:1px solid rgba(237,230,214,.5)}
  #sfx-badge button:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(158,59,38,.6)}
  #sfx-badge.pulse{animation:sfx-pulse 1.2s ease 2}
  #sfx-toast{left:50%;bottom:120px;transform:translate(-50%,20px);opacity:0;pointer-events:none;max-width:min(92vw,460px);
    background:rgba(243,237,224,.96);color:${C.carbon};border-left:5px solid ${C.almagre};border-radius:12px;padding:12px 16px;
    box-shadow:0 10px 30px rgba(0,0,0,.35);transition:opacity .35s,transform .35s}
  #sfx-toast.show{opacity:1;transform:translate(-50%,0)}
  #sfx-toast .z{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${C.almagre};font-weight:700}
  #sfx-toast .n{font-family:Cinzel,Georgia,serif;font-weight:800;font-size:18px;margin:2px 0}
  #sfx-toast .h{font-size:13px}
  #sfx-panel{inset:0;background:rgba(20,18,16,.55);display:none;align-items:flex-end;justify-content:center}
  #sfx-panel.open{display:flex}
  #sfx-panel .card{width:min(100%,720px);max-height:78vh;overflow:auto;background:${C.papel};color:${C.carbon};
    border-radius:18px 18px 0 0;padding:18px 18px 26px;box-shadow:0 -10px 30px rgba(0,0,0,.4);animation:sfx-up .35s ease both}
  #sfx-panel h3{font-family:Cinzel,Georgia,serif;color:${C.almagre};margin:4px 0 12px;font-size:20px}
  #sfx-panel h4{margin:14px 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6E726A}
  #sfx-panel .chips{display:flex;flex-wrap:wrap;gap:6px}
  #sfx-panel .chip{border:1.5px solid #d9cfba;background:#fff;border-radius:999px;padding:7px 11px;font:13px Montserrat,Arial,sans-serif;
    cursor:pointer;color:${C.carbon};transition:.15s}
  #sfx-panel .chip:hover{border-color:${C.ocre};transform:translateY(-1px)}
  #sfx-panel .chip.v{background:#efe6d2}
  #sfx-panel .chip.v::before{content:"✓ ";color:#4F6B3A;font-weight:700}
  #sfx-panel .chip.s::after{content:" ◉";color:${C.almagre}}
  #sfx-panel .chip.aqui{border-color:${C.almagre};box-shadow:0 0 0 2px rgba(158,59,38,.25)}
  #sfx-panel .x{float:right;border:0;background:${C.carbon};color:${C.hueso};width:34px;height:34px;border-radius:50%;cursor:pointer}
  #sfx-modal{inset:0;background:rgba(20,18,16,.6);display:none;align-items:center;justify-content:center;padding:12px}
  #sfx-modal.open{display:flex}
  #sfx-modal .fr{position:relative;width:min(100%,540px);height:min(92vh,860px);border-radius:16px;overflow:hidden;
    box-shadow:0 20px 50px rgba(0,0,0,.5);animation:sfx-up .3s ease both;background:${C.papel}}
  #sfx-modal iframe{width:100%;height:100%;border:0}
  #sfx-modal .x{position:absolute;top:10px;right:10px;z-index:2;border:0;background:${C.carbon};color:${C.hueso};
    width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px}
  #sfx-vig{inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 62%,rgba(30,27,24,.35) 100%);z-index:2147482999}
  @keyframes sfx-in{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1}}
  #sfx-modal .fr{transform:none}
  @keyframes sfx-up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
  @keyframes sfx-pulse{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.35)}50%{box-shadow:0 0 0 6px rgba(201,154,46,.35),0 6px 18px rgba(0,0,0,.35)}}
  @media (max-width:600px){#sfx-badge .exp{display:none}#sfx-badge{top:8px;gap:7px}#sfx-toast{bottom:150px}}
  ${reduce ? ".sfx,.sfx *{animation:none!important;transition:none!important}" : ""}`;
  document.head.appendChild(css);

  /* ---------- elementos ---------- */
  const el = (id, html) => { const d = document.createElement("div"); d.id = id; d.className = "sfx"; d.innerHTML = html; document.body.appendChild(d); return d; };
  el("sfx-vig", "");
  const badge = el("sfx-badge", "");
  function textosBadge() {
    badge.innerHTML = `<span class="t">${T("pas")}</span><span class="dots"></span><span class="exp"></span>
    <button class="sec" data-a="explorar" title="${T("tExp")}">${T("exp")}</button><button data-a="pasaporte" title="${T("tPas")}">${T("abrir")}</button>`;
  }
  textosBadge();
  const toast = el("sfx-toast", "");
  const panel = el("sfx-panel", `<div class="card" role="dialog" aria-label="Explorar el recorrido"></div>`);
  const modal = el("sfx-modal", `<div class="fr"><button class="x" aria-label="Cerrar">✕</button><iframe title="Pasaporte"></iframe></div>`);

  /* ---------- estado ---------- */
  const sellos = () => (leer(D.claveSellos, { sellos: [] }).sellos || []).length;
  let visitados = new Set(leer(KV, []));
  let actual = -1, ultimosSellos = sellos();

  function pintarBadge() {
    const n = sellos(), tot = D.totalSellos || 7;
    badge.querySelector(".dots").innerHTML = Array.from({ length: tot }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
    const panos = D.medias.filter(m => m.tipo === "panorama").length || D.medias.length;
    badge.querySelector(".exp").textContent = D.medias.length ? `${visitados.size}/${panos} ${T("explorados")}` : "";
    if (n > ultimosSellos) { badge.classList.remove("pulse"); void badge.offsetWidth; badge.classList.add("pulse"); }
    ultimosSellos = n;
  }

  let tt;
  function avisar(m) {
    const tiene = m.sello && (leer(D.claveSellos, { sellos: [] }).sellos || []).includes(m.sello);
    const hint = m.sello ? (tiene ? T("tienes") : T("hay")).replace("{n}", m.sello)
      : (m.tipo === "modelo3d" ? T("gira") : "");
    toast.innerHTML = `<div class="z">${esc(zon(m.zona))}</div><div class="n">${esc(tit(m))}</div>${hint ? `<div class="h">${esc(hint)}</div>` : ""}`;
    toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), m.sello && !tiene ? 5200 : 3200);
  }

  function alCambiar(i) {
    if (i === actual || i == null || i < 0) return;
    actual = i; const m = D.medias[i]; if (!m) return;
    if (m.tipo === "panorama") { visitados.add(i); guardar(KV, [...visitados]); }
    pintarBadge(); avisar(m);
    if (panel.classList.contains("open")) pintarPanel();
  }

  function ir(i) {
    const T = window.TDVTour;
    try { T.setPlayListSelectedIndex(T.mainPlayList, i); } catch (e) { try { T.mainPlayList.set("selectedIndex", i); } catch (e2) {} }
    cerrar();
  }

  function pintarPanel() {
    const card = panel.querySelector(".card");
    const nav = !!window.TDVTour;
    card.innerHTML = `<button class="x" aria-label="${T("cerrar")}">✕</button><h3>${T("titulo")}</h3>
      <p style="margin:0 0 4px;font-size:13px;color:#6E726A">${nav ? T("tocar") : T("menu")} ${T("leyenda")}</p>` +
      (D.zonas || []).map(z => {
        const ms = D.medias.filter(m => m.zona === z); if (!ms.length) return "";
        return `<h4>${esc(zon(z))}</h4><div class="chips">${ms.map(m => `<button class="chip ${visitados.has(m.i) ? "v" : ""} ${m.sello ? "s" : ""} ${m.i === actual ? "aqui" : ""}"
          data-i="${m.i}" ${nav ? "" : "disabled"}>${esc(tit(m))}</button>`).join("")}</div>`;
      }).join("");
    card.querySelector(".x").onclick = cerrar;
    card.querySelectorAll(".chip").forEach(b => b.onclick = () => ir(+b.dataset.i));
  }

  function abrirPanel() { pintarPanel(); panel.classList.add("open"); }
  function abrirPasaporte(hash) { modal.querySelector("iframe").src = D.pasaporte + (idioma() === "en" ? "?lang=en" : "") + (hash || ""); modal.classList.add("open"); }
  function cerrar() { panel.classList.remove("open"); if (modal.classList.contains("open")) { modal.classList.remove("open"); modal.querySelector("iframe").src = "about:blank"; pintarBadge(); } }

  badge.addEventListener("click", e => { const a = e.target.dataset && e.target.dataset.a; if (a === "explorar") abrirPanel(); if (a === "pasaporte") abrirPasaporte(""); });
  panel.addEventListener("click", e => { if (e.target === panel) cerrar(); });
  modal.addEventListener("click", e => { if (e.target === modal) cerrar(); });
  modal.querySelector(".x").onclick = cerrar;
  addEventListener("keydown", e => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "Escape") cerrar();
    else if (e.key === "p" || e.key === "P") abrirPasaporte("");
    else if (e.key === "e" || e.key === "E") abrirPanel();
  });
  addEventListener("storage", e => { if (e.key === D.claveSellos) pintarBadge(); });
  setInterval(pintarBadge, 2500);
  let ultIdioma = idioma();
  setInterval(() => { const l = idioma(); if (l !== ultIdioma) { ultIdioma = l; textosBadge(); pintarBadge();
    if (panel.classList.contains("open")) pintarPanel(); } }, 800);

  /* ---------- enganche con el reproductor de 3DVista ---------- */
  function enganchar() {
    const T = window.TDVTour; if (!T || !T.mainPlayList) return false;
    const pl = T.mainPlayList;
    const leerIdx = () => { try { return pl.get("selectedIndex"); } catch (e) { return -1; } };
    try { pl.bind("change", () => alCambiar(leerIdx())); } catch (e) {}
    setInterval(() => alCambiar(leerIdx()), 1000);   // respaldo por si el evento no existe en esta versión
    alCambiar(leerIdx());
    return true;
  }
  if (!enganchar()) { let n = 0; const iv = setInterval(() => { if (enganchar() || ++n > 30) clearInterval(iv); }, 500); }

  /* ---------- bienvenida (una vez por visita) en la ventana del pasaporte de 3DVista ----------
     3DVista cambia el id del WebFrame al publicar, así que se busca dentro de la ventana. */
  function bienvenida() {
    const T = window.TDVTour; if (!T) return false;
    const w = T.window_DC457BDD_80F4_BD9E_41CF_87839B6DD4B4; if (!w) return false;
    if (window.__guaitipanBienvenida) return true;
    const buscar = (c, d) => { if (!c || d > 6) return null;
      try { if (c.get("class") === "WebFrame") return c; } catch (e) {}
      let ch = []; try { ch = c.get("children") || []; } catch (e) {}
      for (const x of ch) { const f = buscar(x, d + 1); if (f) return f; } return null; };
    const wf = buscar(w, 0); if (!wf) return false;
    window.__guaitipanBienvenida = true;
    try { if (!w.get("visible")) {
      wf.set("url", T.translate("PopupWebFrameBehaviour_0539E5A3_D3AB_899D_4140_EF851C9C9941.url"));
      T.showWindowBase(w, null, false); } } catch (e) { console.log(e); }
    return true;
  }
  if (!bienvenida()) { let n = 0; const ib = setInterval(() => { if (bienvenida() || ++n > 30) clearInterval(ib); }, 500); }
  window.SkinFx = { abrirPasaporte, abrirPanel, alCambiar, ir };
  pintarBadge();
})();
