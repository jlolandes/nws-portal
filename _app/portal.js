/* Portal de proyectos NWS · motor de la página tipo app.
   Cada proyecto define window.NWS = {...} (ver README.md de esta carpeta) y carga este archivo. */
(function () {
  'use strict';
  var D = window.NWS || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clp = function (v) { return '$' + Math.round(v || 0).toLocaleString('es-CL'); };
  var vib = function (ms) { try { navigator.vibrate && navigator.vibrate(ms || 10); } catch (e) { /* sin vibración */ } };
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var logo = D.logo || 'logo.png';

  var TIPO = {
    camara: ['Cámara', '#06B6D4'], detector: ['Detector de humo', '#EF4444'], sirena: ['Sirena', '#F97316'],
    punto_red: ['Punto de red', '#22C55E'], ap: ['Access point', '#8B5CF6'], bocina: ['Bocina', '#F59E0B'],
    telefono: ['Teléfono', '#0EA5E9'], consola: ['Consola', '#14B8A6'], central: ['Central / hub', '#B91C1C'],
    nodo: ['Nodo', '#14275C'], otro: ['Otro equipo', '#64748B']
  };
  var PLURAL = { camara: 'cámaras', detector: 'detectores de humo', sirena: 'sirenas', punto_red: 'puntos de red', ap: 'access points', bocina: 'bocinas', telefono: 'teléfonos', consola: 'consolas', central: 'centrales', nodo: 'nodos de red', otro: 'otros equipos' };
  var ETQ = { detector: 'D', sirena: 'S', punto_red: 'P', ap: 'AP', bocina: 'B', telefono: 'T', consola: 'C' };
  var etiqueta = function (p) { return p.e || (p.t === 'nodo' ? 'N' + (p.n || '') : p.t === 'camara' ? p.n : p.t === 'central' ? 'HUB' : (ETQ[p.t] || '·') + (p.n == null ? '' : p.n)); };
  var COLOR_CX = function (c) { return c === 'PTP' ? '#FF4D6D' : c === 'Radio' ? '#EF4444' : c === 'Audio 100 V' ? '#F59E0B' : /Fibra/.test(c || '') ? '#FACC15' : '#22D3EE'; };

  var IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
    slides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17 19 7"/></svg>'
  };

  // ---------- números que cuentan ----------
  function contar(el, hasta, fmt, dur) {
    fmt = fmt || function (x) { return Math.round(x).toLocaleString('es-CL'); };
    var desde = Number(el.dataset.v || 0); el.dataset.v = hasta;
    if (quieto || desde === hasta) { el.textContent = fmt(hasta); return; }
    var t0 = performance.now(); dur = dur || 900;
    (function paso(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(desde + (hasta - desde) * e);
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
  function numDe(v) { if (typeof v === 'number') return { n: v, suf: '' }; var m = String(v).match(/^([\d.]+)(.*)$/); return m ? { n: Number(m[1].replace(/\./g, '')), suf: m[2] } : null; }

  // ---------- estructura ----------
  var puntos = (D.puntos || []).filter(function (p) { return p.x != null && p.y != null; });
  var nodos = {}; (D.puntos || []).forEach(function (p) { if ((p.t === 'nodo' || p.t === 'central') && p.d) nodos[p.d] = p; });
  var cots = D.cotizaciones || [];
  var principal = cots[0] || null;

  document.title = (D.cliente ? D.cliente + ' · ' : '') + (D.sitio || D.titulo || 'Proyecto') + ' · NWS' + (D.demo ? ' (DEMO)' : '');
  var app = document.createElement('div');
  app.innerHTML =
    '<div id="sp"><div><div class="lg"><img src="' + esc(logo) + '" alt="NWS"></div><div class="bar"><i></i></div></div></div>' +
    '<header class="top"><a class="lg" href="#inicio"><img src="' + esc(logo) + '" alt="NWS"></a><div class="t"><b>' + esc(D.titulo || D.sitio) + '</b><small>' + esc([D.cliente, D.codigo].filter(Boolean).join(' · ')) + '</small></div>' + (D.demo ? '<span class="demo">DEMO</span>' : '') + '</header>' +
    '<main class="views">' +
      '<section class="view" id="v-inicio"></section>' +
      '<section class="view" id="v-plano"></section>' +
      '<section class="view" id="v-inversion"></section>' +
      '<section class="view" id="v-archivos"></section>' +
    '</main>' +
    '<nav class="tabs"><span class="ind"></span>' +
      '<a href="#inicio" data-v="inicio">' + IC.home + 'Inicio</a>' +
      '<a href="#plano" data-v="plano">' + IC.map + 'Plano</a>' +
      '<a href="#inversion" data-v="inversion">' + IC.cash + 'Inversión</a>' +
      '<a href="#archivos" data-v="archivos">' + IC.doc + 'Archivos</a>' +
    '</nav>' +
    '<div class="sheet-bg"></div><div class="sheet"><div class="grab"></div><div class="sc"></div></div>';
  while (app.firstChild) document.body.appendChild(app.firstChild);

  // ---------- INICIO ----------
  (function () {
    var v = $('#v-inicio');
    var etapas = D.etapas || [
      { t: 'Visita en terreno', d: D.fecha_visita ? 'Levantamiento ' + D.fecha_visita : 'Levantamiento del sitio', estado: 'ok' },
      { t: 'Propuesta', d: 'Cotización, plano y presentación', estado: 'now' },
      { t: 'Aprobación', d: 'Orden de compra o aceptación firmada', estado: '' },
      { t: 'Instalación', d: 'Equipos, cableado y configuración', estado: '' },
      { t: 'Entrega', d: 'Pruebas, capacitación y as-built', estado: '' }
    ];
    v.innerHTML =
      '<div class="hero"><div class="bgimg" style="background-image:url(\'' + esc(D.portada || D.imagen || '') + '\')"></div><div class="pins" id="pins"></div><div class="shade"></div>' +
        '<div class="in"><span class="k">' + esc((D.demo ? 'Propuesta DEMO' : 'Propuesta') + (D.fecha ? ' · ' + D.fecha : '')) + '</span>' +
        '<h1>' + esc(D.titulo || D.sitio) + '</h1><p>' + esc([D.cliente, D.direccion].filter(Boolean).join(' · ')) + '</p>' +
        '<div class="chips">' + [D.linea, D.codigo, principal && principal.numero].filter(Boolean).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div>' +
        (D.imagen && puntos.length ? '<button class="play press" id="btn-anim">' + IC.play + 'Ver animación</button>' : '') + '</div></div>' +
      '<div class="kpis">' + (D.kpis || []).slice(0, 3).map(function (k, i) { return '<div class="kpi rv" style="transition-delay:' + (i * 90) + 'ms"><b data-k="' + i + '">' + esc(k.v) + '</b><span>' + esc(k.l) + '</span></div>'; }).join('') + '</div>' +
      (principal ? '<div class="sec rv"><div class="big"><small>Inversión del proyecto</small><div class="n tab-num" id="h-neto">$0</div><p>neto · <span id="h-total"></span> con IVA</p>' +
        '<a class="cta press" href="#inversion">Ver inversión y cuotas ' + IC.arrow + '</a></div></div>' : '') +
      ((D.alcance || []).length ? '<div class="sec"><h2>Qué incluye</h2><ul class="list card">' + D.alcance.map(function (a, i) { return '<li class="rv" style="transition-delay:' + (i * 60) + 'ms"><span class="ck">' + IC.check + '</span><span>' + esc(a) + '</span></li>'; }).join('') + '</ul></div>' : '') +
      '<div class="sec"><h2>Etapas</h2><div class="card steps rv" id="steps"><span class="fill"></span>' + etapas.map(function (e) { return '<div class="step ' + (e.estado || '') + '"><i></i><b>' + esc(e.t) + '</b><small>' + esc(e.d || '') + '</small></div>'; }).join('') + '</div></div>' +
      '<footer class="f">NetWatch Solutions SpA · RUT 77.859.162-6<br>' + esc((D.contacto && D.contacto.nombre) || 'Jerry Lolandes') + ' · ' + esc((D.contacto && D.contacto.cargo) || 'Jefe de Proyecto') + ' · <a href="https://www.nws.cl" style="color:var(--cyan)">www.nws.cl</a></footer>';
    // los pines del hero usan las posiciones en % de la imagen (se calculan al cargar la imagen)
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      $('#pins').innerHTML = puntos.slice(0, 60).map(function (p, i) {
        return '<span class="pin" style="left:' + (p.x / w * 100) + '%;top:' + (p.y / h * 100) + '%;background:' + (TIPO[p.t] || TIPO.otro)[1] + ';animation-delay:' + (700 + i * 40) + 'ms,' + (1500 + i * 40) + 'ms"></span>';
      }).join('');
      // el hero es más angosto que la imagen: ajusta el encuadre al centro de los puntos
      if (D.portada) return;
      var bg = $('.hero .bgimg'); var cx = puntos.length ? puntos.reduce(function (a, p) { return a + p.x; }, 0) / puntos.length / w * 100 : 50;
      bg.style.backgroundPosition = cx + '% 50%';
      var pinsEl = $('#pins'); var heroW = pinsEl.clientWidth, heroH = pinsEl.clientHeight;
      var esc2 = Math.max(heroW / w, heroH / h), dw = w * esc2, dh = h * esc2;
      var offX = (heroW - dw) * cx / 100, offY = (heroH - dh) / 2;
      $$('.pin', pinsEl).forEach(function (el, i) { var p = puntos[i]; el.style.left = (offX + p.x * esc2) + 'px'; el.style.top = (offY + p.y * esc2) + 'px'; });
    };
    if (D.imagen) img.src = D.imagen;
  })();

  // ---------- PLANO ----------
  var mapa = { s: 1, x: 0, y: 0, w: 0, h: 0 };
  (function () {
    var v = $('#v-plano');
    var tipos = {}; puntos.forEach(function (p) { tipos[p.t] = (tipos[p.t] || 0) + 1; });
    v.innerHTML =
      '<div class="mapbar">' + Object.keys(tipos).map(function (t) { var tp = TIPO[t] || TIPO.otro; return '<button class="fch press" data-t="' + t + '"><i style="background:' + tp[1] + '"></i>' + esc(tp[0]) + ' · ' + tipos[t] + '</button>'; }).join('') + '</div>' +
      '<div class="map" id="map"><div class="hint" id="hint">Arrastra para moverte · toca un punto</div><div class="stage" id="stage"><img id="mimg" alt="Plano del sitio" draggable="false"><svg id="msvg"></svg><div id="mks"></div></div>' +
      '<div class="zoom"><button class="press" data-z="1">+</button><button class="press" data-z="-1">−</button></div></div>' +
      (D.atribucion ? '<p class="attr">' + esc(D.atribucion) + '</p>' : '') +
      ((D.documentos || []).filter(function (d) { return d.tipo === '3d'; }).map(function (d) { return '<a class="cta sec2 press" style="margin-top:12px" href="' + esc(d.url) + '">' + IC.cube + ' ' + esc(d.nombre) + '</a>'; }).join(''));
    var map = $('#map'), stage = $('#stage'), mimg = $('#mimg');
    function aplicar(anim) { stage.style.transition = anim && !quieto ? 'transform .35s cubic-bezier(.2,.8,.2,1)' : 'none'; stage.style.transform = 'translate(' + mapa.x + 'px,' + mapa.y + 'px) scale(' + mapa.s + ')'; }
    function limitar() {
      var W = map.clientWidth, H = map.clientHeight, w = mapa.w * mapa.s, h = mapa.h * mapa.s;
      mapa.x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, mapa.x));
      mapa.y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, mapa.y));
    }
    function zoomEn(f, cx, cy, anim) {
      var min = Math.min(map.clientWidth / mapa.w, map.clientHeight / mapa.h), s2 = Math.max(min, Math.min(min * 8, mapa.s * f));
      mapa.x = cx - (cx - mapa.x) * (s2 / mapa.s); mapa.y = cy - (cy - mapa.y) * (s2 / mapa.s); mapa.s = s2; limitar(); aplicar(anim);
      $$('.mk', stage).forEach(function (m) { m.style.setProperty('--k', (1 / mapa.s).toFixed(3)); });
    }
    mimg.onload = function () {
      mapa.w = mimg.naturalWidth; mapa.h = mimg.naturalHeight;
      stage.style.width = mapa.w + 'px'; stage.style.height = mapa.h + 'px';
      var svg = $('#msvg'); svg.setAttribute('viewBox', '0 0 ' + mapa.w + ' ' + mapa.h); svg.setAttribute('width', mapa.w); svg.setAttribute('height', mapa.h);
      var sw = Math.max(2, mapa.w / 500);
      svg.innerHTML = puntos.filter(function (p) { return p.to && nodos[p.to] && nodos[p.to].x != null; }).map(function (p, i) {
        var n = nodos[p.to], len = Math.hypot(n.x - p.x, n.y - p.y);
        return '<line data-t="' + p.t + '" x1="' + n.x + '" y1="' + n.y + '" x2="' + p.x + '" y2="' + p.y + '" stroke="' + COLOR_CX(p.c) + '" stroke-width="' + sw + '" stroke-linecap="round" opacity=".9" style="--len:' + len.toFixed(0) + ';animation-delay:' + (300 + i * 50) + 'ms"/>';
      }).join('');
      $('#mks').innerHTML = puntos.map(function (p, i) {
        var tp = TIPO[p.t] || TIPO.otro;
        return '<button class="mk' + (p.t === 'nodo' ? ' nodo' : '') + '" data-i="' + i + '" data-t="' + p.t + '" style="left:' + p.x + 'px;top:' + p.y + 'px;background:' + tp[1] + ';animation-delay:' + (200 + i * 35) + 'ms">' + esc(etiqueta(p)) + '</button>';
      }).join('');
      mapa.listo = true; encuadrar();
    };
    // encuadre inicial (solo cuando el plano está visible: oculto mide 0): cubre la altura y centra en los puntos
    function encuadrar() {
      var W = map.clientWidth, H = map.clientHeight;
      if (!mapa.listo || !W || !H || mapa.encuadrado) return;
      mapa.encuadrado = true;
      mapa.s = Math.max(W / mapa.w, H / mapa.h);
      var cx = puntos.length ? puntos.reduce(function (a, p) { return a + p.x; }, 0) / puntos.length : mapa.w / 2;
      var cy = puntos.length ? puntos.reduce(function (a, p) { return a + p.y; }, 0) / puntos.length : mapa.h / 2;
      mapa.x = W / 2 - cx * mapa.s; mapa.y = H / 2 - cy * mapa.s; limitar(); aplicar(false);
      $$('.mk', stage).forEach(function (m) { m.style.setProperty('--k', (1 / mapa.s).toFixed(3)); });
    }
    window.addEventListener('resize', function () { if (!mapa.encuadrado) encuadrar(); else if (map.clientWidth) { limitar(); aplicar(false); } });
    if (D.imagen) mimg.src = D.imagen;

    // arrastrar y pellizcar
    var ptrs = {}, ini = null, movido = false;
    map.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zoom')) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; map.setPointerCapture(e.pointerId); movido = false;
      var ks = Object.keys(ptrs);
      ini = ks.length === 2 ? { d: Math.hypot(ptrs[ks[0]].x - ptrs[ks[1]].x, ptrs[ks[0]].y - ptrs[ks[1]].y), s: mapa.s, x: mapa.x, y: mapa.y } : { px: e.clientX, py: e.clientY, x: mapa.x, y: mapa.y };
      $('#hint').style.opacity = 0;
    });
    map.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId] || !ini) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ks = Object.keys(ptrs), r = map.getBoundingClientRect();
      if (ks.length === 2 && ini.d) {
        var a = ptrs[ks[0]], b = ptrs[ks[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        var cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
        mapa.s = ini.s; mapa.x = ini.x; mapa.y = ini.y; zoomEn(d / ini.d, cx, cy, false); movido = true;
      } else if (ini.px != null) {
        var dx = e.clientX - ini.px, dy = e.clientY - ini.py;
        if (Math.abs(dx) + Math.abs(dy) > 5) movido = true;
        mapa.x = ini.x + dx; mapa.y = ini.y + dy; limitar(); aplicar(false);
      }
    });
    var fin = function (e) {
      var era = ptrs[e.pointerId]; delete ptrs[e.pointerId];
      if (!movido && era && e.type === 'pointerup') { var el = document.elementFromPoint(e.clientX, e.clientY); var mk = el && el.closest('.mk'); if (mk) abrirPunto(+mk.dataset.i); }
      ini = Object.keys(ptrs).length ? null : null;
    };
    map.addEventListener('pointerup', fin); map.addEventListener('pointercancel', fin);
    map.addEventListener('wheel', function (e) { e.preventDefault(); var r = map.getBoundingClientRect(); zoomEn(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top, false); }, { passive: false });
    $$('.zoom button', map).forEach(function (b) { b.onclick = function () { vib(8); zoomEn(b.dataset.z === '1' ? 1.6 : 1 / 1.6, map.clientWidth / 2, map.clientHeight / 2, true); }; });
    $$('.fch', v).forEach(function (b) {
      b.onclick = function () {
        vib(8); b.classList.toggle('off'); var off = b.classList.contains('off'), t = b.dataset.t;
        $$('.mk[data-t="' + t + '"]', stage).forEach(function (m) { m.classList.toggle('hide', off); });
        $$('line[data-t="' + t + '"]', stage).forEach(function (l) { l.style.opacity = off ? 0 : .9; });
      };
    });
  })();

  function abrirPunto(i) {
    var p = puntos[i]; if (!p) return; vib(12);
    $$('.mk').forEach(function (m) { m.classList.toggle('sel', +m.dataset.i === i); });
    var tp = TIPO[p.t] || TIPO.otro;
    var meta = [['Sector', p.s], ['Conexión', p.c], ['Hacia', p.to], ['Cable', p.m ? p.m + ' m' : null], ['Modelo', p.mod]].filter(function (x) { return x[1]; });
    abrirHoja('<span class="chip" style="background:' + tp[1] + ';color:#fff;border:0">' + esc(tp[0]) + '</span>' +
      '<h3 style="margin-top:10px">' + esc(p.t === 'nodo' || p.t === 'central' ? (p.d || tp[0]) : tp[0] + ' ' + (p.n == null ? '' : p.n)) + '</h3>' +
      (p.d && p.t !== 'nodo' && p.t !== 'central' ? '<p style="margin:0;color:var(--gray)">' + esc(p.d) + '</p>' : '') +
      '<div class="meta">' + meta.map(function (m) { return '<div><small>' + esc(m[0]) + '</small><b>' + esc(m[1]) + '</b></div>'; }).join('') + '</div>');
  }

  // ---------- INVERSIÓN ----------
  var estadoInv = { c: 0, iva: false, plan: 0 };
  (function () {
    var v = $('#v-inversion');
    if (!cots.length) { v.innerHTML = '<div class="card" style="padding:20px">La cotización se publicará aquí.</div>'; return; }
    v.innerHTML =
      '<div class="cots" id="cots">' + cots.map(function (c, i) {
        return '<div class="big" data-i="' + i + '"><small>' + esc(c.nombre || 'Cotización') + '</small><div class="n tab-num" data-n="' + i + '">$0</div><p>' + esc(c.numero || '') + (c.mensual ? ' · mensual' : '') + '</p>' + (c.nota ? '<p style="margin-top:6px;opacity:.85">' + esc(c.nota) + '</p>' : '') + '</div>';
      }).join('') + '</div>' +
      (cots.length > 1 ? '<div class="dots">' + cots.map(function (c, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' : '') +
      '<div class="card plan rv"><div class="seg" id="s-iva"><span class="pill"></span><button class="on" data-x="0">Neto</button><button data-x="1">Con IVA</button></div>' +
        '<div class="seg" id="s-plan" style="margin-top:10px"><span class="pill"></span><button class="on" data-x="0">Contado</button><button data-x="12">12 cuotas</button><button data-x="24">24 cuotas</button></div>' +
        '<div class="row"><b class="tab-num" id="p-monto">$0</b><small id="p-lbl"></small></div>' +
        '<div id="p-desglose" style="margin-top:8px;color:var(--gray);font-size:13px"></div>' +
        '<a class="cta press" id="p-pdf" target="_blank" rel="noopener">' + IC.doc + ' Descargar cotización (PDF)</a></div>' +
      '<p class="note">Valores en pesos chilenos. IVA 19 %. Las cuotas son referenciales y sin interés; se confirman al aprobar. ' + esc(D.validez ? 'Validez: ' + D.validez + '.' : '') + '</p>' +
      (D.contacto && D.contacto.email ? '<a class="cta sec2 press" href="mailto:' + esc(D.contacto.email) + '?subject=' + encodeURIComponent('Aprobación ' + ((principal && principal.numero) || 'propuesta') + ' · ' + (D.titulo || '')) + '">Aceptar la propuesta</a>' : '');
    var segs = function (id, cb) {
      var s = $(id), bs = $$('button', s), pill = $('.pill', s);
      var mover = function (i) { pill.style.width = 'calc((100% - 8px) / ' + bs.length + ')'; pill.style.transform = 'translateX(' + (i * 100) + '%)'; };
      mover(0);
      bs.forEach(function (b, i) { b.onclick = function () { vib(8); bs.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); mover(i); cb(+b.dataset.x); }; });
    };
    segs('#s-iva', function (x) { estadoInv.iva = !!x; pintarInv(); });
    segs('#s-plan', function (x) { estadoInv.plan = x; pintarInv(); });
    var cs = $('#cots');
    cs.addEventListener('scroll', function () {
      var i = Math.round(cs.scrollLeft / (cs.firstChild.clientWidth + 12));
      if (i !== estadoInv.c && cots[i]) { estadoInv.c = i; vib(6); $$('.dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); }); pintarInv(); }
    }, { passive: true });
  })();
  function pintarInv() {
    var c = cots[estadoInv.c]; if (!c) return;
    var monto = estadoInv.iva ? (c.total || Math.round(c.neto * 1.19)) : c.neto;
    var plan = c.mensual ? 0 : estadoInv.plan;
    var cuota = plan ? monto / plan : monto;
    contar($('#p-monto'), cuota, clp, 700);
    $('#p-lbl').textContent = c.mensual ? (estadoInv.iva ? 'al mes con IVA' : 'al mes neto') : plan ? (estadoInv.iva ? 'por cuota con IVA' : 'por cuota neto') : (estadoInv.iva ? 'total con IVA' : 'total neto');
    $('#p-desglose').textContent = 'Neto ' + clp(c.neto) + ' · IVA ' + clp(c.iva || Math.round(c.neto * .19)) + ' · Total ' + clp(c.total || Math.round(c.neto * 1.19)) + (plan ? ' · ' + plan + ' cuotas' : '');
    var pdf = $('#p-pdf'); if (c.pdf) { pdf.href = c.pdf; pdf.style.display = ''; } else pdf.style.display = 'none';
    $$('#cots .n').forEach(function (n, i) { if (!n.dataset.v || n.dataset.v === '0') contar(n, cots[i].neto, clp, 1000); });
    $$('#s-plan button').forEach(function (b) { b.disabled = !!c.mensual && b.dataset.x !== '0'; b.style.opacity = b.disabled ? .4 : 1; });
  }

  // ---------- ARCHIVOS ----------
  (function () {
    var v = $('#v-archivos');
    var docs = (D.documentos || []);
    var icono = function (t) { return t === 'video' ? IC.play : t === '3d' ? IC.cube : t === 'slides' ? IC.slides : IC.doc; };
    v.innerHTML = (D.video ? '<div class="sec" style="margin-top:0"><h2>Video de la propuesta</h2><video class="vid rv" src="' + esc(D.video) + '" controls playsinline preload="metadata"' + (D.video_poster ? ' poster="' + esc(D.video_poster) + '"' : '') + '></video></div>' : '') +
      '<div class="sec"' + (D.video ? '' : ' style="margin-top:0"') + '><h2>Documentos</h2><div class="docs">' + docs.map(function (d, i) {
        return '<a class="card doc press rv" style="transition-delay:' + (i * 60) + 'ms" href="' + esc(d.url) + '"' + (/\.(pdf|mp4)$/i.test(d.url) ? ' target="_blank" rel="noopener"' : '') + '><span class="th">' + (d.thumb ? '<img src="' + esc(d.thumb) + '" alt="" loading="lazy">' : icono(d.tipo)) + '</span><span style="min-width:0"><b>' + esc(d.nombre) + '</b><small>' + esc(d.detalle || '') + '</small></span><span class="go">' + IC.arrow + '</span></a>';
      }).join('') + '</div></div>';
  })();

  // ---------- hoja inferior ----------
  function abrirHoja(html) { $('.sheet .sc').innerHTML = html; $('.sheet-bg').classList.add('on'); $('.sheet').classList.add('on'); }
  function cerrarHoja() { $('.sheet-bg').classList.remove('on'); $('.sheet').classList.remove('on'); $$('.mk.sel').forEach(function (m) { m.classList.remove('sel'); }); }
  $('.sheet-bg').onclick = cerrarHoja;
  (function () { var y0 = null; var sh = $('.sheet'); sh.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true }); sh.addEventListener('touchend', function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 60) cerrarHoja(); y0 = null; }); })();
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarHoja(); });

  // ---------- navegación por pestañas ----------
  var ORDEN = ['inicio', 'plano', 'inversion', 'archivos'], actual = -1;
  function ir() {
    var k = (location.hash || '#inicio').slice(1); var i = ORDEN.indexOf(k); if (i < 0) i = 0;
    if (i === actual) return;
    var atras = i < actual; actual = i; cerrarHoja();
    $$('.view').forEach(function (s) { s.classList.remove('on', 'back'); });
    var vista = $('#v-' + ORDEN[i]); vista.classList.add('on'); if (atras) vista.classList.add('back');
    $$('.tabs a').forEach(function (a, j) { a.classList.toggle('on', j === i); });
    $('.tabs .ind').style.transform = 'translateX(' + (i * 100) + '%)';
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    revelar();
    if (ORDEN[i] === 'inversion') pintarInv();
    if (ORDEN[i] === 'plano') window.dispatchEvent(new Event('resize'));
  }
  $$('.tabs a').forEach(function (a) { a.addEventListener('click', function () { vib(10); }); });
  window.addEventListener('hashchange', ir);

  // ---------- revelado al desplazar y contadores ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; var el = e.target; el.classList.add('vis'); io.unobserve(el);
      var b = $('b[data-k]', el); if (b) { var k = (D.kpis || [])[+b.dataset.k], nd = k && numDe(k.v); if (nd) contar(b, nd.n, function (x) { return Math.round(x).toLocaleString('es-CL') + nd.suf; }); }
      if (el.id === 'steps') { var st = $$('.step', el), ult = -1; st.forEach(function (s, j) { if (/ok|now/.test(s.className)) ult = j; }); if (ult >= 0) { var tgt = st[ult]; $('.fill', el).style.height = (tgt.offsetTop + 10 - 8) + 'px'; } }
      if ($('#h-neto', el) && principal) { contar($('#h-neto'), principal.neto, clp, 1200); $('#h-total').textContent = clp(principal.total || principal.neto * 1.19); }
    });
  }, { threshold: .2 }) : null;
  function revelar() { $$('.view.on .rv:not(.vis)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('vis'); }); }

  window.addEventListener('load', function () { setTimeout(function () { $('#sp').classList.add('off'); }, quieto ? 0 : 650); });
  setTimeout(function () { $('#sp').classList.add('off'); }, 2500);
  ir();

  // ---------- Animación de la propuesta (pantalla completa, ~30 s) ----------
  // Título → imagen del sitio con los puntos apareciendo por tipo y los cables dibujándose → indicadores
  // → qué incluye → inversión. Usa los mismos datos de la página; nada se genera aparte.
  function animacion() {
    var ov = document.createElement('div'); ov.className = 'anim'; ov.setAttribute('role', 'dialog');
    var tipos = {}; puntos.forEach(function (p) { (tipos[p.t] = tipos[p.t] || []).push(p); });
    var grupos = Object.keys(tipos).sort(function (a, b) { return (a === 'nodo' || a === 'central') - (b === 'nodo' || b === 'central'); });
    var c = principal;
    ov.innerHTML =
      '<div class="a-stage"><img class="a-img" alt=""><svg class="a-svg"></svg><div class="a-mks"></div></div><div class="a-shade"></div>' +
      '<div class="a-txt"></div>' +
      '<div class="a-bar"><i></i></div><button class="a-x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(ov); vib(12);
    var txt = $('.a-txt', ov), stage = $('.a-stage', ov), img = $('.a-img', ov), svg = $('.a-svg', ov), mks = $('.a-mks', ov), bar = $('.a-bar i', ov);
    var timers = [], fin = false;
    var luego = function (ms, fn) { timers.push(setTimeout(function () { if (!fin) fn(); }, ms)); };
    var cerrar = function () { fin = true; timers.forEach(clearTimeout); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, 400); };
    $('.a-x', ov).onclick = cerrar;
    var escena = function (html, cls) { txt.className = 'a-txt ' + (cls || ''); txt.innerHTML = html; void txt.offsetWidth; txt.classList.add('in'); };
    var T = 0; var paso = function (dur, fn) { luego(T, fn); T += dur; };
    var W = innerWidth, H = innerHeight;
    img.onload = function () {
      var nw = img.naturalWidth, nh = img.naturalHeight;
      var cx = puntos.reduce(function (a, p) { return a + p.x; }, 0) / puntos.length, cy = puntos.reduce(function (a, p) { return a + p.y; }, 0) / puntos.length;
      var minX = Math.min.apply(null, puntos.map(function (p) { return p.x; })), maxX = Math.max.apply(null, puntos.map(function (p) { return p.x; }));
      var minY = Math.min.apply(null, puntos.map(function (p) { return p.y; })), maxY = Math.max.apply(null, puntos.map(function (p) { return p.y; }));
      // Escala: que los puntos quepan a lo ancho si se puede; si no, al menos medio alto de pantalla y un paneo de lado a lado.
      var sPts = Math.min((W * .84) / Math.max(1, maxX - minX), (H * .5) / Math.max(1, maxY - minY));
      var s = Math.max(sPts, (H * .55) / nh, W / nw);
      s = Math.min(s, (H / nh) * 4);
      stage.style.width = nw + 'px'; stage.style.height = nh + 'px';
      var ancho = nw * s, alto = nh * s;
      var ty = alto <= H ? H * .44 - alto / 2 : Math.min(0, Math.max(H - alto, H * .44 - cy * s));
      var clampX = function (x) { return ancho <= W ? (W - ancho) / 2 : Math.min(0, Math.max(W - ancho, x)); };
      var visible = W / s, cabe = (maxX - minX) <= visible * .9;
      var txA = clampX(W / 2 - (cabe ? cx : minX + visible * .42) * s);
      var txB = clampX(W / 2 - (cabe ? cx : maxX - visible * .42) * s);
      stage.style.setProperty('--t0', 'translate(' + (W / 2 - ancho * .7 / 2) + 'px,' + (H / 2 - alto * .7 / 2) + 'px) scale(' + (s * .7) + ')');
      stage.style.setProperty('--t1', 'translate(' + txA + 'px,' + ty + 'px) scale(' + s + ')');
      stage.style.setProperty('--t2', 'translate(' + txB + 'px,' + ty + 'px) scale(' + s + ')');
      svg.setAttribute('viewBox', '0 0 ' + nw + ' ' + nh); svg.setAttribute('width', nw); svg.setAttribute('height', nh);
      var k = 1 / s;
      mks.innerHTML = puntos.map(function (p, i) { var tp = TIPO[p.t] || TIPO.otro; return '<span class="a-mk" data-t="' + p.t + '" style="left:' + p.x + 'px;top:' + p.y + 'px;background:' + tp[1] + ';--k:' + k + ';color:' + tp[1] + '">' + esc(etiqueta(p)) + '</span>'; }).join('');
      svg.innerHTML = puntos.filter(function (p) { return p.to && nodos[p.to] && nodos[p.to].x != null; }).map(function (p) {
        var n = nodos[p.to], len = Math.hypot(n.x - p.x, n.y - p.y);
        return '<line data-t="' + p.t + '" x1="' + n.x + '" y1="' + n.y + '" x2="' + p.x + '" y2="' + p.y + '" stroke="' + COLOR_CX(p.c) + '" stroke-width="' + (2.2 * k) + '" style="--len:' + len.toFixed(0) + '"/>';
      }).join('');
      arrancar();
    };
    img.onerror = function () { arrancar(); };
    img.src = D.imagen;
    function arrancar() {
      var total = 0;
      paso(3600, function () { escena('<img class="a-logo" src="' + esc(logo) + '" alt="NWS"><small>' + esc(D.demo ? 'Propuesta DEMO' : 'Propuesta') + '</small><h2>' + esc(D.titulo || D.sitio) + '</h2><p>' + esc([D.cliente, D.direccion].filter(Boolean).join(' · ')) + '</p>', 'centro'); });
      paso(900, function () { ov.classList.add('mapa'); escena(''); luego(4200, function () { ov.classList.add('pan'); }); });
      grupos.forEach(function (t) {
        paso(2300, function () {
          var tp = TIPO[t] || TIPO.otro, n = tipos[t].length;
          $$('.a-mk[data-t="' + t + '"]', mks).forEach(function (m, i) { setTimeout(function () { m.classList.add('on'); }, i * Math.min(90, 1400 / n)); });
          escena('<b class="a-n" style="color:' + tp[1] + '">' + n + '</b><span>' + esc(n === 1 ? tp[0].toLowerCase() : (PLURAL[t] || tp[0].toLowerCase())) + '</span>', 'abajo');
          vib(8);
        });
      });
      paso(2600, function () { $$('line', svg).forEach(function (l, i) { setTimeout(function () { l.classList.add('on'); }, i * 40); }); escena('<span>Todo conectado a sus nodos</span>', 'abajo'); });
      paso(3800, function () {
        ov.classList.add('oscuro');
        escena('<div class="a-kpis">' + (D.kpis || []).slice(0, 3).map(function (k2) { return '<div><b>' + esc(k2.v) + '</b><span>' + esc(k2.l) + '</span></div>'; }).join('') + '</div>', 'centro');
      });
      if ((D.alcance || []).length) paso(5200, function () { escena('<small>Qué incluye</small><ul>' + D.alcance.slice(0, 5).map(function (a, i) { return '<li style="animation-delay:' + (i * 280) + 'ms">' + esc(a) + '</li>'; }).join('') + '</ul>', 'centro izq'); });
      if (c) paso(5200, function () {
        escena('<small>Inversión del proyecto</small><b class="a-total" id="a-total">$0</b><p>neto · ' + clp(c.total || c.neto * 1.19) + ' con IVA</p>' + (c.mensual ? '' : '<p class="a-cuotas">o ' + clp((c.total || c.neto * 1.19) / 12) + ' en 12 cuotas sin interés</p>'), 'centro');
        contar($('#a-total', ov), c.neto, clp, 1600);
      });
      paso(4200, function () { escena('<img class="a-logo" src="' + esc(logo) + '" alt="NWS"><h2>Gracias</h2><p>Revisa el plano, la inversión y los documentos en esta página.</p><button class="cta press" id="a-fin">Ver la propuesta</button>', 'centro'); $('#a-fin', ov).onclick = cerrar; });
      total = T; bar.style.transition = 'width ' + total + 'ms linear'; requestAnimationFrame(function () { bar.style.width = '100%'; });
    }
  }
  var btnAnim = $('#btn-anim'); if (btnAnim) btnAnim.onclick = animacion;
  if (/[?&#]animacion/.test(location.href)) setTimeout(animacion, 900);
})();
