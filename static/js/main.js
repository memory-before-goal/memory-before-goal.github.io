
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of kids) if (c != null) n.append(c);
    return n;
  };
  const SVGNS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, text) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };
  const fmt = (x, d = 2) => x.toFixed(d);
  const tbd = () => el("span", { class: "tbd" }, "TBD");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HOVER_RATE = 2;

  const AURL = (p) => (window.ASSET_URLS && window.ASSET_URLS[p]) || p;
  document.querySelectorAll("video[src^='static/video/']").forEach((v) => { const u = AURL(v.getAttribute("src")); if (u !== v.getAttribute("src")) v.src = u; });

  if (window.SITE && SITE.draft) $("#draft-banner").hidden = false;
  document.querySelectorAll("[data-link]").forEach((a) => {
    const href = window.SITE && SITE.links[a.dataset.link];
    if (href) { a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; return; }
    a.classList.add("resource-disabled"); a.setAttribute("aria-disabled", "true");
    const v = a.querySelector(".resource-value"); if (v) v.textContent = "Coming Soon";
  });

  const LV = ["L0", "L1", "L2"];

  function wipeGrid(box, seg, specs) {
    if (!box) return;
    const SWEEP = 7;
    let level = 0;
    const setX = (t, x) => {
      t.x = Math.max(0, Math.min(100, x));
      t.wipe.style.setProperty("--x", `${t.x.toFixed(2)}%`);
      t.knob.setAttribute("aria-valuenow", Math.round(t.x));
      t.wipe.classList.toggle("hide-l", t.x < 16); t.wipe.classList.toggle("hide-r", t.x > 84);
    };
    const play = (t) => {
      t.base.playbackRate = t.rate; t.base.play().catch(() => {});
      if (t.has) { try { t.top.currentTime = t.base.currentTime; } catch (e) {} t.top.playbackRate = t.rate; t.top.play().catch(() => {}); }
    };
    const stop = (t) => {
      t.base.pause(); t.top.pause();
      if (t.has) try { t.top.currentTime = t.base.currentTime; } catch (e) {}
    };
    const tiles = specs.map(({ name, tag, tagClass, caption, srcs, card }, i) => {
      const vid = (cls) => el("video", { class: cls, muted: "", loop: "", playsinline: "", preload: "metadata" });
      const base = vid("w-base"), top = vid("w-top");
      base.setAttribute("aria-label", `${name}: WholeBodyMem rollout from the head camera`); top.setAttribute("aria-hidden", "true");
      const arrows = svg("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" });
      arrows.append(svg("path", { d: "M6 4 2 8l4 4M10 4l4 4-4 4", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }));
      const knob = el("span", { class: "w-knob", role: "slider", tabindex: "0", "aria-label": `${name}: divider between the SAM3 masks and the plain video`,
        "aria-valuemin": "0", "aria-valuemax": "100" }, arrows);
      const wipe = el("div", { class: "wipe" }, base, top, el("span", { class: "w-line", "aria-hidden": "true" }), knob,
        el("span", { class: "w-lab l", "aria-hidden": "true" }, "SAM3 masks"), el("span", { class: "w-lab r", "aria-hidden": "true" }, (card && card.querySelector("video[data-wipe]")?.dataset.right) || "Video"));
      const old = card && card.querySelector("video[data-wipe]");
      const rate = Number((old && old.dataset.speed) || HOVER_RATE);
      wipe.append(el("span", { class: "speed-pill", "aria-hidden": "true" }, `${rate}\u00d7`));
      if (card) { old.replaceWith(wipe); card.classList.add("wipe-item"); }
      else box.append(el("div", { class: "video-item wipe-item" }, wipe,
        el("p", {}, el("span", { class: `tag ${tagClass}` }, tag), el("b", {}, `${name}.`), ...(caption ? [" ", caption] : []))));
      base.muted = top.muted = true;
      base.defaultPlaybackRate = top.defaultPlaybackRate = rate;
      const t = { srcs, rate, base, top, wipe, knob, x: 50, phase: i * 1.3, manual: false, has: false, dragged: false,
        inView: false, held: false };
      let drag = null;
      wipe.addEventListener("pointerdown", (e) => {
        if (!t.has) return;
        const r = wipe.getBoundingClientRect();
        if (e.target.closest(".w-knob") || Math.abs(e.clientX - (r.left + r.width * t.x / 100)) < 24) {
          drag = e.pointerId; t.manual = true; wipe.setPointerCapture(e.pointerId); e.preventDefault();
        }
      });
      wipe.addEventListener("pointermove", (e) => {
        if (drag !== e.pointerId) return;
        const r = wipe.getBoundingClientRect(); setX(t, (e.clientX - r.left) / r.width * 100);
      });
      const end = (e) => { if (drag === e.pointerId) { drag = null; t.dragged = true; } };
      wipe.addEventListener("pointerup", end); wipe.addEventListener("pointercancel", end);
      wipe.addEventListener("click", () => {
        if (t.dragged) { t.dragged = false; return; }
        if (t.base.paused) { t.held = false; play(t); } else { t.held = true; stop(t); }
      });
      knob.addEventListener("keydown", (e) => {
        const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
        if (step != null) { t.manual = true; setX(t, t.x + step); e.preventDefault(); }
        else if (e.key === "Home" || e.key === "End") { t.manual = true; setX(t, e.key === "Home" ? 0 : 100); e.preventDefault(); }
      });
      setX(t, 50);
      return t;
    });
    const buttons = seg ? seg.querySelectorAll("button") : [];
    function render() {
      tiles.forEach((t) => {
        const wasPlaying = !t.base.paused, src = t.srcs(level);
        t.has = !!src.top;
        t.base.src = src.base; t.base.poster = src.basePoster;
        if (t.has) { t.top.src = src.top; t.top.poster = src.topPoster; }
        else { t.top.pause(); t.top.removeAttribute("src"); t.top.removeAttribute("poster"); t.top.load(); }
        t.wipe.classList.toggle("no-sam3", !t.has);
        if (wasPlaying || (t.inView && !t.held && !reduceMotion)) play(t);
      });
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", j === level ? "true" : "false"));
    }
    buttons.forEach((b, j) => b.addEventListener("click", () => { level = j; render(); }));
    render();

    if ("IntersectionObserver" in window && !reduceMotion) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        const t = tiles.find((x) => x.wipe === e.target); if (!t) return;
        t.inView = e.isIntersecting;
        if (t.inView && !t.held) play(t); else if (!t.inView) stop(t);
      }), { threshold: 0.25 });
      tiles.forEach((t) => io.observe(t.wipe));
    }

    const tick = (now) => {
      tiles.forEach((t) => {
        if (!t.has) return;
        if (!t.manual && !reduceMotion) setX(t, 50 + 42 * Math.sin(2 * Math.PI * (now / 1000 + t.phase) / SWEEP));
        if (t.base.paused) { if (!t.top.paused) t.top.pause(); return; }
        if (t.top.readyState < 2) return;
        if (t.top.paused) t.top.play().catch(() => {});
        const d = t.base.currentTime - t.top.currentTime;
        if (Math.abs(d) > 0.3) t.top.currentTime = t.base.currentTime;
        else t.top.playbackRate = t.rate * (1 + Math.max(-0.25, Math.min(0.25, 2 * d)));
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const levelSrcs = (file, sam3) => (k) => {
    const f = `${file}_${LV[k]}`, has = sam3.includes(k);
    return { base: AURL(`static/video/${f}.mp4`), basePoster: `static/img/posters/${f}.jpg`,
      top: has ? AURL(`static/video/${f}_sam3.mp4`) : null, topPoster: has ? `static/img/posters/${f}_sam3.jpg` : null };
  };

  if (window.SIMPLE_VIDEOS) wipeGrid($("#simple-videos"), $("#simple-level"), SIMPLE_VIDEOS.map(([id, name, file, instruction]) => (
    { name: `${id} ${name}`, tag: "Success", tagClass: "tag-ok", caption: instruction ? `\u201c${instruction}\u201d` : null, srcs: levelSrcs(file, [0, 1, 2]) })));

  if (window.MEMORY_VIDEOS) wipeGrid($("#memory-videos"), $("#memory-level"), MEMORY_VIDEOS.map(([key, name, type, tagClass, file, instruction, sam3]) => (
    { name, tag: type, tagClass, caption: `\u201c${instruction}\u201d`, srcs: levelSrcs(file, sam3) })));

  ["#teleop-grid"].forEach((sel) => {
    const box = $(sel); if (!box) return;
    wipeGrid(box, null, [...box.querySelectorAll(".video-item")].filter((c) => c.querySelector("video[data-wipe]")).map((card) => {
      const v = card.querySelector("video[data-wipe]"), f = v.dataset.file, b = card.querySelector("p b");
      return { card, name: b ? b.textContent.replace(/\.$/, "") : f, srcs: () => ({
        base: AURL(`static/video/wipe_${f}.mp4`), basePoster: v.getAttribute("poster"),
        top: AURL(`static/video/wipe_${f}_sam3.mp4`), topPoster: `static/img/posters/${f}_sam3.jpg` }) };
    }));
  });

  (function comparisons() {
    const box = $("#cmp-cards"); if (!box || !window.COMPARISONS) return;
    const S = window.MEMORY_TASKS ? MEMORY_TASKS.success : null, per = window.MEMORY_TASKS ? MEMORY_TASKS.perLevel : 30;
    COMPARISONS.forEach((c) => {
      const seg = el("div", { class: "seg", role: "group", "aria-label": `${c.task} level` },
        ...["L0", "L1", "L2"].map((l, i) => el("button", { type: "button", "aria-pressed": i === 0 ? "true" : "false" }, l)));
      const v = el("video", { "data-inview": "", muted: "", loop: "", playsinline: "", controls: "", preload: "none", "aria-label": `${c.task}: WholeBodyMem, Uniform memory and Psi0 on the same evaluation episode` });
      const title = el("h4", {}), note = el("p", { class: "note" });
      box.append(el("div", { class: "task-card" },
        el("div", { class: "card-head" }, title, seg),
        el("p", { class: "instr" }, el("b", {}, "Task instruction: "), c.instruction), v, note));
      const set = (i) => {
        const L = c.levels[i], lv = `L${i}`;
        const playing = !v.paused;
        v.src = AURL(`static/video/cmp_${c.key}_${lv}.mp4`); v.poster = `static/img/posters/cmp_${c.key}_${lv}.jpg`;
        if (playing) v.play().catch(() => {});
        title.textContent = `${c.task} · level ${lv} · pad ${L.answer} blinks`;
        const rate = (m) => S && S[m][c.key] ? `${S[m][c.key][i]}/${per}` : "TBD";
        note.textContent = `Evaluation episode ${L.ep}. WholeBodyMem ${c.verb} ${L.wbm}; Uniform memory ${c.verb} ${L.uniform} and Ψ0 ${c.verb} ${L.psi0}. ` +
          `Successes over all 30 episodes at ${lv}: WholeBodyMem ${rate("wbm")}, Uniform memory ${rate("uniform")}, Ψ0 ${rate("psi0")}.`;
        seg.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
      };
      seg.querySelectorAll("button").forEach((b, j) => b.addEventListener("click", () => set(j)));
      set(0);
    });
  })();

  document.querySelectorAll("video").forEach((v) => { v.muted = true; });

  const autos = document.querySelectorAll("video[data-auto]");
  autos.forEach((v) => {
    const rate = Number(v.dataset.speed || HOVER_RATE); v.defaultPlaybackRate = v.playbackRate = rate; v.preload = "metadata";
    const card = v.closest(".media") || v.closest(".video-item");
    if (card) card.append(el("span", { class: "speed-pill", "aria-hidden": "true" }, `${v.dataset.label || rate}\u00d7`));
    v.addEventListener("click", () => {
      if (v.paused) { v.dataset.held = "0"; v.playbackRate = rate; v.play().catch(() => {}); } else { v.dataset.held = "1"; v.pause(); }
    });
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting && e.target.dataset.held !== "1") { e.target.playbackRate = e.target.defaultPlaybackRate; e.target.play().catch(() => {}); }
      else if (!e.isIntersecting) e.target.pause();
    }), { threshold: 0.25 });
    autos.forEach((v) => io.observe(v));
  }

  const inview = document.querySelectorAll("video[data-inview]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
    }), { threshold: 0.45 });
    inview.forEach((v) => { v.preload = "metadata"; io.observe(v); });
  }
  const teaser = $("#teaser");
  if (teaser && reduceMotion) { teaser.removeAttribute("autoplay"); teaser.pause(); }

  (function ep7() {
    const D = window.REAL_EP7; if (!D || !$("#ep7-slots")) return;
    const fps = 30, cue = new Set(D.bag_frames);
    const slots = $("#ep7-slots"), verdict = $("#ep7-verdict");
    const show = (which) => {
      const frames = which === "wbm" ? D.memory : D.uniform;
      slots.replaceChildren(...frames.map((f) => {
        const isCue = cue.has(f), isNow = f === D.decision;
        const s = el("div", { class: "slot" + (isCue ? " cue" : "") + (isNow ? " now" : "") },
          el("div", { class: "pic", role: "img", "aria-label": `Frame at ${fmt(f / fps)} s` + (isCue ? ", shows the bag" : "") }),
          el("div", { class: "t" }, isNow ? `${fmt(f / fps, 1)} s · now` : `${fmt(f / fps, 1)} s`));
        s.firstChild.style.backgroundImage = `url(static/img/real_ep7/ep7_f${String(f).padStart(4, "0")}.jpg)`;
        if (isCue) s.append(el("span", { class: "flag" }, "bag"));
        return s;
      }));
      const hit = frames.filter((f) => cue.has(f));
      verdict.className = "verdict " + (hit.length ? "yes" : "no");
      verdict.textContent = hit.length ? `keeps the bag's last appearance (${fmt(hit[0] / fps, 1)} s)` : "no frame shows the bag";
      $("#ep7-wbm").setAttribute("aria-pressed", which === "wbm");
      $("#ep7-uni").setAttribute("aria-pressed", which !== "wbm");
    };
    $("#ep7-wbm").addEventListener("click", () => show("wbm"));
    $("#ep7-uni").addEventListener("click", () => show("uni"));
    show("wbm");
  })();

  function evTimeline(area, events, mapX) {
    const stems = svg("svg", { class: "evtl-stems", "aria-hidden": "true" });
    area.append(stems);
    const items = events.map((e) => {
      const D_ = e.k === "D", deps = e.deps || [];
      const box = el("div", { class: "evtl-box future" + (D_ ? " d" : "") },
        el("div", { class: "hd" }, el("span", { class: "id" }, e.k), el("span", { class: "tm" }, e.time)),
        el("div", { class: "tx" }, e.text));
      const dep = deps.length ? el("div", { class: "evtl-dep future" + (D_ ? " d" : "") }, ...deps.map(([k, why]) =>
        el("div", {}, el("span", { class: "ar" }, "←"), el("span", { class: "dk" }, k), why ? el("span", { class: "why" }, why) : null))) : null;
      area.append(box); if (dep) area.append(dep);
      return { box, dep };
    });
    let last = null, now0 = null, stemEls = [];
    function place() {
      const W = area.clientWidth || 1, n = events.length, GAP = 10;
      const bw = Math.min(196, Math.floor((W - (n - 1) * GAP) / n)), compact = bw < 112;
      area.classList.toggle("compact", compact);
      items.forEach(({ box, dep }) => {
        box.style.width = `${bw}px`; box.style.height = "auto";
        if (!dep) return;
        if (compact && dep.parentNode !== box) { box.append(dep); dep.style.width = ""; dep.style.left = dep.style.top = ""; }
        if (!compact && dep.parentNode !== area) area.append(dep);
        if (!compact) dep.style.width = `${bw - 26}px`;
      });
      const BH = Math.max(...items.map(({ box }) => box.offsetHeight));
      items.forEach(({ box }) => { box.style.height = `${BH}px`; });
      const DH = compact ? 0 : Math.max(0, ...items.map(({ dep }) => (dep ? dep.offsetHeight : 0)));
      const SH = Math.max(22, DH + 14), H = BH + SH;
      const cx = events.map((e) => [mapX(e.t0, W), mapX(e.t1, W)]);

      const L = cx.map(([a]) => Math.max(0, Math.min(W - bw, a - 14)));
      for (let i = 1; i < n; i++) L[i] = Math.max(L[i], L[i - 1] + bw + GAP);
      for (let i = n - 1; i >= 0; i--) L[i] = Math.max(0, Math.min(L[i], i === n - 1 ? W - bw : L[i + 1] - bw - GAP));
      area.style.height = `${H}px`;
      stems.setAttribute("viewBox", `0 0 ${W} ${H}`); stems.setAttribute("width", W); stems.setAttribute("height", H);
      stems.replaceChildren(); stemEls = [];
      items.forEach(({ box, dep }, i) => {
        box.style.left = `${L[i]}px`;
        const sx = L[i] + 14;
        if (dep && !compact) { dep.style.left = `${sx + 9}px`; dep.style.top = `${BH + 7}px`; }
        const [a, b] = cx[i], ends = b - a >= 5 ? [a + 1, b - 1] : [(a + b) / 2 - 2, (a + b) / 2 + 2];
        const g = svg("g", { class: "evtl-stem future" + (events[i].k === "D" ? " d" : "") });
        ends.forEach((x, j) => { const s = sx - 2 + 4 * j; g.append(svg("path", { d: `M${s} ${BH} C${s} ${BH + SH * 0.55} ${x} ${BH + SH * 0.45} ${x} ${H}` })); });
        g.append(svg("circle", { cx: sx, cy: BH, r: 2.6 }));
        stems.append(g); stemEls.push(g);
      });
      last = null;
    }
    function set(now) {
      now0 = now;
      let a = -1; events.forEach((e, i) => { if (now >= e.t0) a = i; });
      if (a === last) return;
      last = a;
      items.forEach(({ box, dep }, i) => {
        box.classList.toggle("future", i > a); box.classList.toggle("cur", i === a);
        if (dep) { dep.classList.toggle("future", i > a); dep.classList.toggle("cur", i === a); }
      });
      stemEls.forEach((g, i) => { g.classList.toggle("future", i > a); g.classList.toggle("cur", i === a); });
    }
    place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { place(); if (now0 != null) set(now0); });
    window.addEventListener("resize", () => { place(); if (now0 != null) set(now0); });
    return { set, place };
  }

  document.querySelectorAll(".evtl[data-ev]").forEach((root) => {
    const card = root.closest(".video-item"), v = card && card.querySelector("video"); if (!v) return;
    const events = JSON.parse(root.dataset.ev).map(([k, t0, t1, text, deps]) => ({ k, t0, t1, text, deps,
      time: t1 - t0 >= 0.3 ? `${t0.toFixed(1)}–${t1.toFixed(1)} s` : `${t0.toFixed(1)} s` }));
    let span = Number(root.dataset.dur) || events[events.length - 1].t1 * 1.1;
    const area = el("div", { class: "evtl-area" }), axis = el("div", { class: "evtl-axis" }), gaps = el("div", { class: "evtl-gaps" });
    const fill = el("div", { class: "evtl-fill" }), head = el("div", { class: "evtl-head" });
    const marks = events.map((e) => el("i", { class: e.k === "D" ? "evtl-dmark" : "evtl-band" }));
    axis.append(fill, ...marks, head);
    root.replaceChildren(area, axis, gaps);
    let kn = [], kW = -1;
    const knots = (W) => {
      if (W === kW) return kn;
      const slot = W / events.length, BAND = 10;
      kn = [[0, 0]];
      events.forEach((e, i) => { const x = i * slot + 14; kn.push([e.t0, x], [e.t1, e.k === "D" ? x : x + BAND]); });
      kn.push([Math.max(span, events[events.length - 1].t1 + 0.1), W]); kW = W;
      return kn;
    };
    const mapX = (t, W) => {
      const k = knots(W);
      for (let j = 0; j < k.length - 1; j++) {
        const [t0, x0] = k[j], [t1, x1] = k[j + 1];
        if (t <= t1) return t1 > t0 ? x0 + ((Math.max(t, t0) - t0) / (t1 - t0)) * (x1 - x0) : x1;
      }
      return W;
    };
    const tl = evTimeline(area, events, mapX);
    const placeAxis = () => {
      const W = axis.clientWidth || 1;
      marks.forEach((m, j) => {
        const a = mapX(events[j].t0, W), b = mapX(events[j].t1, W);
        m.style.left = `${a}px`; if (events[j].k !== "D") m.style.width = `${Math.max(4, b - a)}px`;
      });
      gaps.replaceChildren(); axis.querySelectorAll(".evtl-break").forEach((x) => x.remove());
      const k = knots(W);
      for (let j = 0; j < k.length - 1; j++) {
        const dt = k[j + 1][0] - k[j][0], x = (k[j][1] + k[j + 1][1]) / 2;
        if (dt < 4 || k[j + 1][1] - k[j][1] < 24) continue;
        axis.insertBefore(Object.assign(el("span", { class: "evtl-break" }, "≈"), { style: `left:${x}px` }), head);
        gaps.append(Object.assign(el("span", { class: "evtl-gap" }, `${Math.round(dt)} s`), { style: `left:${x}px` }));
      }
    };
    placeAxis();
    const upd = () => {
      const W = axis.clientWidth || 1, x = mapX(Math.min(v.currentTime, span), W);
      fill.style.width = `${x}px`; head.style.left = `${x}px`;
      marks.forEach((m, j) => m.classList.toggle("on", v.currentTime >= events[j].t0));
      tl.set(v.currentTime);
    };
    let raf = 0;
    const loop = () => { upd(); raf = requestAnimationFrame(loop); };
    v.addEventListener("loadedmetadata", () => { if (v.duration) { span = v.duration; kW = -1; tl.place(); placeAxis(); } upd(); });
    v.addEventListener("play", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
    v.addEventListener("pause", () => { cancelAnimationFrame(raf); upd(); });
    v.addEventListener("seeked", upd);
    window.addEventListener("resize", () => { placeAxis(); upd(); });
    upd();
  });

  (function explorer() {
    const D = window.EXPLORER_DATA; if (!D || !$("#explorer")) return;
    const M = 7, GAP = 5, N = D.frames, FPS = D.fps;
    const [b0, b1] = D.blink;
    const isBlink = (f) => f >= b0 && f <= b1;

    const EVENTS = [
      { frame: b1, kind: "disappears", rank: 2, known: b1 + 1 },
      { frame: b0, kind: "appears", rank: 1, known: b0 + 1 }
    ];

    const PAD = D.answer_pad;
    const xpTl = $("#xp-evarea") && evTimeline($("#xp-evarea"), [
      { k: "E1", t0: b0, t1: b0, time: `${fmt(b0 / FPS)} s`, text: `yellow light appears on pad ${PAD}`, deps: [] },
      { k: "E2", t0: b1, t1: b1, time: `${fmt(b1 / FPS)} s`, text: `yellow light disappears from pad ${PAD}`, deps: [["E1", "same light, 0.2 s later"]] },
      { k: "D", t0: D.decision, t1: D.decision, time: `${fmt(D.decision / FPS)} s`, text: `place the chips can on pad ${PAD}`, deps: [["E1", "which pad lit"], ["E2", "light gone"]] }
    ], (f, W) => (f / (N - 1)) * W);
    const evTag = (f) => (f === b0 ? "E1" : f === b1 ? "E2" : "event");
    const linspace = (t, n) => n === 1 ? [0] : Array.from({ length: n }, (_, i) => Math.round((i * t) / (n - 1)));
    const uniformMem = (t) => [...new Set(linspace(t, Math.min(M, t + 1)))].sort((a, b) => a - b);
    function objectGuided(t) {
      const B = Math.min(M, t + 1), Be = Math.min(B - 1, Math.floor(0.75 * B));
      const ev = EVENTS.filter((e) => t >= e.known && e.frame < t).sort((a, b) => b.rank - a.rank);
      if (!ev.length) return { frames: uniformMem(t), events: new Set() };
      const S = [];
      for (const e of ev) {
        if (S.length >= Be) break;
        if (!S.some((f) => Math.abs(f - e.frame) <= GAP)) S.push(e.frame);
      }
      const evSet = new Set(S), out = new Set(S);
      linspace(t, Math.max(1, B - S.length)).forEach((f) => out.add(f));
      out.add(t);
      while (out.size < B) {
        let best = 0, bd = -1;
        for (let f = 0; f <= t; f++) { let d = Infinity; out.forEach((g) => { d = Math.min(d, Math.abs(f - g)); }); if (d > bd) { bd = d; best = f; } }
        out.add(best);
      }
      const frames = [...out].sort((a, b) => a - b);
      while (frames.length > B) { const i = frames.findIndex((f) => !evSet.has(f) && f !== t); frames.splice(i, 1); }
      return { frames, events: evSet };
    }

    const SF = D.sprite_frames, rows = Math.ceil(SF.length / D.cols);
    const SPRITE = "static/img/explorer/blinkpad_ep34_sprite.jpg";
    const nearest = (f) => { let lo = 0, hi = SF.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (SF[m] < f) lo = m + 1; else hi = m; }
      return lo > 0 && Math.abs(SF[lo - 1] - f) <= Math.abs(SF[lo] - f) ? lo - 1 : lo; };
    function thumbStyle(div, f) {
      const k = nearest(f), r = Math.floor(k / D.cols), c = k % D.cols;
      div.style.backgroundImage = `url(${SPRITE})`;
      div.style.backgroundSize = `${D.cols * 100}% ${rows * 100}%`;
      div.style.backgroundPosition = `${(c / (D.cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`;
    }
    function renderSlots(box, frames, t, evSet) {
      const kids = [];
      for (let i = 0; i < M; i++) {
        const f = frames[i];
        if (f == null) { kids.push(el("div", { class: "slot empty" }, el("div", { class: "pic" }), el("div", { class: "t" }, "empty"))); continue; }
        const cue = isBlink(f), now = f === t;
        const s = el("div", { class: "slot" + (cue ? " cue" : "") + (now ? " now" : "") },
          el("div", { class: "pic", role: "img", "aria-label": `Frame ${f}` + (cue ? ", pad blinking" : "") }),
          el("div", { class: "t" }, now ? `${fmt(f / FPS)} s · now` : `${fmt(f / FPS)} s`));
        thumbStyle(s.firstChild, f);
        if (cue) s.append(el("span", { class: "flag" }, evSet && evSet.has(f) ? evTag(f) : "blink"));
        kids.push(s);
      }
      box.replaceChildren(...kids);
    }

    const video = $("#xp-video"), range = $("#xp-t");
    range.max = String(N - 1);
    $("#xp-end").textContent = `${fmt((N - 1) / FPS, 1)} s`;
    const pct = (f) => `${(f / (N - 1)) * 100}%`;
    $("#xp-band").style.left = pct(b0); $("#xp-band").style.width = pct(b1 - b0 + 1);
    $("#xp-decline").style.left = pct(D.decision);
    const ticks = (lane, frames) => lane.replaceChildren(...frames.map((f) => { const i = document.createElement("i"); i.style.left = pct(f); return i; }));
    let t = D.decision;
    function update(fromVideo) {
      const u = uniformMem(t), w = objectGuided(t);
      renderSlots($("#xp-slots-u"), u, t);
      renderSlots($("#xp-slots-w"), w.frames, t, w.events);
      ticks($("#xp-lane-u"), u); ticks($("#xp-lane-w"), w.frames);
      $("#xp-cursor").style.left = pct(t); $("#xp-future").style.left = pct(t);
      $("#xp-time").textContent = `t = ${fmt(t / FPS)} s`;
      $("#xp-frame").textContent = `frame ${t}`;
      $("#xp-blinktag").hidden = !isBlink(t);
      if (xpTl) xpTl.set(t);
      const cu = u.filter(isBlink).length, cw = w.frames.filter(isBlink).length;
      const label = (n, b) => `${n} / ${b} blink frame${n === 1 ? "" : "s"}`;
      $("#xp-cu").textContent = label(cu, u.length); $("#xp-cu").className = t > b1 ? (cu ? "ok" : "miss") : "";
      $("#xp-cw").textContent = label(cw, w.frames.length); $("#xp-cw").className = t > b1 ? (cw ? "ok" : "miss") : "";
      if (!fromVideo) {
        range.value = String(t);
        try { video.currentTime = Math.min(video.duration || Infinity, (t + 0.5) / FPS); } catch (e) {  }
      }
    }

    let raf = 0, held = false, inView = false, started = false, endTimer = 0;
    const playBtn = $("#xp-play"), icon = $("#xp-play-icon");
    const setBtn = (on) => { playBtn.lastChild.textContent = on ? "Pause" : "Play"; icon.setAttribute("d", on ? "M4 2.5h3v11H4zM9 2.5h3v11H9z" : "M4 2.5v11l9-5.5z"); };
    function stop() { clearTimeout(endTimer); if (!video.paused) video.pause(); cancelAnimationFrame(raf); setBtn(false); }
    function start(fromZero) {
      clearTimeout(endTimer);
      if (fromZero || t >= N - 2) { t = 0; update(false); }
      video.playbackRate = 1;
      video.play().then(() => { setBtn(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }).catch(() => {});
    }
    function loop() {
      t = Math.min(N - 1, Math.round(video.currentTime * FPS)); range.value = String(t); update(true);
      if (video.ended || t >= N - 1) {
        stop(); if (!held && inView && !reduceMotion) endTimer = setTimeout(() => start(true), 1500); return;
      }
      raf = requestAnimationFrame(loop);
    }
    range.addEventListener("input", () => { held = true; stop(); t = +range.value; update(false); });
    playBtn.addEventListener("click", () => { if (!video.paused) { held = true; stop(); } else { held = false; start(false); } });
    $("#xp-blink").addEventListener("click", () => { held = true; stop(); t = Math.round((b0 + b1) / 2); update(false); });
    $("#xp-dec").addEventListener("click", () => { held = true; stop(); t = D.decision; update(false); });
    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver((es) => es.forEach((e) => {
        inView = e.isIntersecting;
        if (inView && !held && video.paused) { start(!started); started = true; }
        else if (!inView && !video.paused) stop();
      }), { threshold: 0.35 }).observe($("#explorer"));
    }
    video.addEventListener("loadedmetadata", () => update(false), { once: true });
    update(false);
  })();

  const COLORS = { psi0: "var(--psi0)", uniform: "var(--uniform)", wbm: "var(--accent)" };
  function legend(box, items, chance) {
    if (!box) return;
    box.replaceChildren(...items.map(([name, c]) => { const i = el("i"); i.style.background = c; return el("span", {}, i, name); }));
    if (chance) box.append(el("span", {}, el("i", { class: "chance-key" }), "chance"));
  }
  (function memoryResults() {
    const R0 = window.MEMORY_TASKS; if (!R0 || !$("#mem-chart")) return;

    const done = R0.tasks.filter((t) => R0.methods.every((m) => {
      const c = R0.success[m.key][t.key];
      return c && c.every((v) => v != null) && R0.decision[m.key][t.key] != null;
    }));
    const R = { ...R0, tasks: done };
    legend($("#mem-legend"), R.methods.map((m) => [m.name, COLORS[m.key]]), true);
    const chart = $("#mem-chart"), W = 760, H = 300, L = 40, Rr = 8, T = 14, Bm = 54;
    chart.setAttribute("viewBox", `0 0 ${W} ${H}`); chart.style.minWidth = "560px";
    const pw = W - L - Rr, ph = H - T - Bm, y = (v) => T + ph * (1 - v / 100);
    [0, 25, 50, 75, 100].forEach((v) => {
      chart.append(svg("line", { class: v ? "grid" : "axis", x1: L, x2: W - Rr, y1: y(v), y2: y(v) }));
      chart.append(svg("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, `${v}%`));
    });
    const gw = pw / R.tasks.length, bw = Math.min(30, (gw - 22) / 3), labels = [];
    R.tasks.forEach((task, i) => {
      const gx = L + i * gw, cx = gx + gw / 2, x0 = cx - (bw * 3 + 8) / 2;
      const vals = R.methods.map((m) => R.decision[m.key][task.key]);
      if (vals.every((v) => v == null)) {
        chart.append(svg("rect", { x: x0, y: y(100), width: bw * 3 + 8, height: ph, fill: "none", stroke: "#d6dbe1", "stroke-dasharray": "4 4", rx: 4 }));
        chart.append(svg("text", { x: cx, y: y(75), "text-anchor": "middle" }, "pending"));
      } else {
        R.methods.forEach((m, j) => {
          const v = vals[j]; if (v == null) return;
          const x = x0 + j * (bw + 4);
          chart.append(svg("rect", { x, y: y(v), width: bw, height: y(0) - y(v), fill: COLORS[m.key], rx: 2 }));
          labels.push(svg("text", { x: x + bw / 2, y: y(v) - 5, "text-anchor": "middle", class: "halo" + (m.key === "wbm" ? " t-strong" : "") }, String(v)));
        });
      }
      chart.append(svg("line", { class: "chance", x1: gx + 8, x2: gx + gw - 8, y1: y(task.chance), y2: y(task.chance) }));
      chart.append(svg("text", { x: cx, y: H - Bm + 20, "text-anchor": "middle", class: "t-ink" }, task.name));
      chart.append(svg("text", { x: cx, y: H - Bm + 36, "text-anchor": "middle" }, task.type));
    });
    labels.forEach((n) => chart.append(n));

    const tbl = $("#mem-table");
    const head = el("tr", {}, el("th", { scope: "col", style: "text-align:left" }, "Method"),
      ...R.tasks.map((t) => el("th", { scope: "col" }, t.name, el("span", { class: "lv" }, t.type))), el("th", { scope: "col" }, "Avg."));
    const best = {};
    R.tasks.forEach((t) => {
      best[t.key] = Math.max(...R.methods.map((m) => { const c = R.success[m.key][t.key]; return c ? c.reduce((a, b) => a + b, 0) : -1; }));
    });
    const body = R.methods.map((m) => {
      const ours = m.key === "wbm" ? "ours" : "";
      const cells = R.tasks.map((t) => {
        const c = R.success[m.key][t.key];
        if (!c) return el("td", { class: ours || null }, tbd());
        const tot = c.reduce((a, b) => a + b, 0);
        const early = R.earlierSet && (R.earlierSet[m.key] || []).includes(t.key) ? "*" : "";
        return el("td", { class: [tot === best[t.key] ? "best" : "", ours].join(" ").trim() || null }, c.join(" / ") + early, el("span", { class: "lv" }, `${tot}/${R.perLevel * 3}`));
      });
      const all = R.tasks.map((t) => R.success[m.key][t.key]);
      const avg = all.every(Boolean) ? `${fmt((100 * all.flat().reduce((a, b) => a + b, 0)) / (R.perLevel * 3 * all.length), 1)}%` : null;
      return el("tr", {}, el("th", { scope: "row", class: ours || null }, m.name), ...cells, el("td", { class: ours || null }, avg || tbd()));
    });
    tbl.replaceChildren(el("thead", {}, head), el("tbody", {}, ...body));
  })();

  (function simpleResults() {
    const R = window.SIMPLE14; if (!R || !$("#simple-table")) return;
    const maxTot = R.tasks.length * R.perLevel * 3;
    const totals = R.methods.map((_, j) => R.tasks.reduce((a, t) => a + t[2][j].reduce((x, y) => x + y, 0), 0));
    if (R.expectedTotals && totals.some((v, j) => v !== R.expectedTotals[j])) console.warn("SIMPLE14 totals differ from the paper:", totals, R.expectedTotals);
    const color = (m) => m.key === "wbm" ? "var(--accent)" : m.key === "uniform" ? "var(--uniform)" : "var(--psi0)";
    legend($("#simple-legend"), [["WholeBodyMem", "var(--accent)"], ["Uniform memory", "var(--uniform)"], ["Policies without memory", "var(--psi0)"]]);

    const order = R.methods.map((m, j) => ({ m, tot: totals[j] })).sort((a, b) => b.tot - a.tot);
    const chart = $("#simple-chart"), W = 760, rowH = 26, T = 6, L = 128, Rr = 132, H = T + order.length * rowH + 22;
    chart.setAttribute("viewBox", `0 0 ${W} ${H}`); chart.style.minWidth = "520px";
    const pw = W - L - Rr, x = (v) => L + (pw * v) / 100;
    [0, 25, 50, 75, 100].forEach((v) => {
      chart.append(svg("line", { class: v ? "grid" : "axis", x1: x(v), x2: x(v), y1: T, y2: H - 18 }));
      chart.append(svg("text", { x: x(v), y: H - 4, "text-anchor": "middle" }, `${v}%`));
    });
    order.forEach(({ m, tot }, i) => {
      const yy = T + i * rowH, pv = (100 * tot) / maxTot;
      chart.append(svg("text", { x: L - 10, y: yy + rowH / 2 + 4, "text-anchor": "end", class: m.key === "wbm" ? "t-strong" : "t-ink" }, m.name));
      chart.append(svg("rect", { x: x(0), y: yy + 4, width: x(pv) - x(0), height: rowH - 9, fill: color(m), rx: 2 }));
      chart.append(svg("text", { x: x(pv) + 8, y: yy + rowH / 2 + 4, class: m.key === "wbm" ? "t-strong" : "" }, `${tot}/${maxTot} · ${fmt(pv, 1)}%`));
    });

    const tbl = $("#simple-table"), toggle = $("#lv-toggle");
    function render() {
      const lv = toggle.checked;
      const head = el("tr", {}, el("th", { scope: "col", style: "text-align:left" }, "Task"),
        ...R.methods.map((m) => el("th", { scope: "col", class: m.key === "wbm" ? "ours" : null }, m.name)));
      const rows = R.tasks.map(([id, name, cells]) => {
        const tots = cells.map((c) => c.reduce((a, b) => a + b, 0));
        const best = Math.max(...tots), second = Math.max(...tots.filter((v) => v < best), -1);
        return el("tr", {}, el("th", { scope: "row" }, el("span", { class: "id" }, id), name),
          ...cells.map((c, j) => el("td", { class: [tots[j] === best ? "best" : tots[j] === second ? "second" : "", R.methods[j].key === "wbm" ? "ours" : ""].join(" ").trim() || null },
            String(tots[j]), lv ? el("span", { class: "lv" }, c.join("/")) : null)));
      });
      const sum = el("tr", { class: "sum" }, el("th", { scope: "row" }, "Σ 14 tasks"),
        ...totals.map((tot, j) => el("td", { class: R.methods[j].key === "wbm" ? "ours best" : null }, `${tot}/${maxTot}`, el("span", { class: "lv" }, `${fmt((100 * tot) / maxTot, 1)}%`))));
      tbl.replaceChildren(el("thead", {}, head), el("tbody", {}, ...rows, sum));
    }
    toggle.addEventListener("change", render);
    render();
  })();

  const copyBtn = $("#bib-copy");
  if (copyBtn) copyBtn.addEventListener("click", async () => {
    const text = $("#bib-text").textContent;
    try { await navigator.clipboard.writeText(text); copyBtn.textContent = "Copied"; }
    catch (err) {
      const r = document.createRange(); r.selectNodeContents($("#bib-text"));
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = "Selected";
    }
    setTimeout(() => { copyBtn.textContent = "Copy"; }, 1600);
  });

  if ("IntersectionObserver" in window) {
    const links = new Map([...document.querySelectorAll(".site-nav ul a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) links.forEach((a, id) => a.classList.toggle("active", id === en.target.id)); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
})();

(function pipeline() {
  const D = document.getElementById("pipe-diagram"); if (!D) return;
  const BASE = 920, board = D.parentElement;

  const box = (id) => {
    const el = document.getElementById(id); let l = 0, t = 0, e = el;
    while (e && e !== D) { l += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; }
    const w = el.offsetWidth, h = el.offsetHeight;
    return { l, t, r: l + w, b: t + h, cx: l + w / 2, cy: t + h / 2 };
  };
  function fit() {
    const cs = getComputedStyle(board);
    const avail = board.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    D.style.zoom = avail > BASE ? String(Math.min(avail / BASE, 1.6)) : "1";
  }
  function draw() {
    const fr = box("pf-frames"), inp = box("pf-inputs"), sel = box("pf-select"), bank = box("pf-bank"), ex = box("pf-expert");
    document.getElementById("pl-frames").setAttribute("d", `M ${inp.cx} ${fr.b + 4} V ${inp.t - 4}`);
    document.getElementById("pl-select").setAttribute("d", `M ${sel.r + 2} ${sel.cy} H ${bank.l - 4}`);
    const yMid = (bank.b + ex.t) / 2 + 6;
    document.getElementById("pl-memory").setAttribute("d", `M ${bank.cx} ${bank.b + 2} V ${yMid} H ${ex.cx} V ${ex.t - 4}`);
  }
  const update = () => { fit(); draw(); };
  update();
  window.addEventListener("resize", update);
  window.addEventListener("load", update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
})();
