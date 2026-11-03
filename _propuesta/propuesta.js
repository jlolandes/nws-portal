/* Motor del formato «Propuesta NWS» (portal.nws.cl/_propuesta/). Cada proyecto define window.PROPUESTA y carga este archivo.
   Campos: ver _propuesta/README.md. Montos siempre netos en CLP; el IVA se calcula aquí (19 %). */
(function arrancar() {
  if (!document.body) { document.addEventListener('DOMContentLoaded', arrancar); return; }
  var P = window.PROPUESTA;
  var clp = function (n) { return '$' + Math.round(n).toLocaleString('es-CL'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var grupos = P.inversion.grupos;
  var cant = {}; grupos.forEach(function (g) { if (g.cantidad) cant[g.id] = g.cantidad.valor; });
  var netoGrupo = function (g) { return g.items.reduce(function (a, i, k) { var q = g.cantidad && k === (g.cantidad.item || 0) ? cant[g.id] : i[1]; return a + q * i[2]; }, 0); };

  /* Barra superior y estructura */
  var secciones = [['resumen', 'Resumen'], ['solucion', 'Solución'], ['plan', 'Plan'], ['inversion', 'Inversión'], ['nws', 'Por qué NWS'], ['aceptar', 'Aceptar']];
  document.body.insertAdjacentHTML('afterbegin',
    '<header class="top"><div class="wrap"><img src="' + esc(P.logo || 'logo.png') + '" alt="NetWatch Solutions"><nav aria-label="Secciones">' +
    secciones.map(function (s) { return '<a href="#' + s[0] + '">' + s[1] + '</a>'; }).join('') + '</nav></div></header>' +
    '<section class="portada" id="inicio"><div class="wrap" id="portada"></div></section><main class="wrap" id="cuerpo"></main>' +
    '<div class="barra" role="region" aria-label="Total de la propuesta"><div class="wrap"><div><small id="barra-etq"></small><b class="num" id="barra-total"></b></div><a class="btn primario" href="#aceptar">Aceptar propuesta</a></div></div>');

  document.getElementById('portada').innerHTML =
    '<div class="etiqueta">Propuesta para ' + esc(P.cliente) + ' · ' + esc(P.linea) + '</div>' +
    '<h1>' + esc(P.titulo) + '</h1><p class="bajada">' + esc(P.bajada) + '</p>' +
    '<div class="ficha">' +
      '<div><span>Preparada para</span><b>' + esc(P.contacto_cliente) + ' · ' + esc(P.cliente) + '</b></div>' +
      '<div><span>Propuesta</span><b>' + esc(P.numero) + '</b></div>' +
      '<div><span>Fecha</span><b>' + esc(P.fecha) + '</b></div>' +
      '<div><span>Válida hasta</span><b>' + esc(P.validez) + '</b></div>' +
    '</div>';

  var h = '';
  h += '<section class="sec" id="resumen"><div class="sec-cab"><div class="etiqueta">Resumen</div><h2>En una mirada</h2></div><div class="resumen">' +
       P.resumen.map(function (r) { return '<div><b>' + esc(r.t) + '</b><p>' + esc(r.d) + '</p></div>'; }).join('') + '</div></section>';

  h += '<section class="sec" id="solucion"><div class="sec-cab"><div class="etiqueta">Solución</div><h2>' + esc(P.solucion.titulo) + '</h2>' + (P.solucion.bajada ? '<p>' + esc(P.solucion.bajada) + '</p>' : '') + '</div><div class="sedes">' +
       P.solucion.bloques.map(function (s) {
         return '<article class="sede"><h3>' + esc(s.nombre) + '</h3>' + (s.sub ? '<small style="color:var(--suave)">' + esc(s.sub) + '</small>' : '') +
           (s.cifra != null ? '<div class="cifra">' + esc(s.cifra) + '<small>' + esc(s.unidad || '') + '</small></div>' : '') +
           '<ul class="lista">' + s.incluye.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></article>';
       }).join('') + '</div></section>';

  h += '<section class="sec" id="plan"><div class="sec-cab"><div class="etiqueta">Plan de trabajo</div><h2>' + esc(P.plan_titulo || 'Cómo seguimos') + '</h2></div><div class="plan">' +
       P.plan.map(function (p) { return '<div class="paso ' + (p.estado || '') + '">' + (p.estado === 'ahora' ? '<em>Estamos aquí</em>' : '') + '<b>' + esc(p.t) + '</b><small>' + esc(p.d) + '</small></div>'; }).join('') + '</div></section>';

  h += '<section class="sec" id="inversion"><div class="sec-cab"><div class="etiqueta">Inversión</div><h2>' + esc(P.inversion.titulo) + '</h2><p>' + esc(P.inversion.bajada) + '</p></div><div class="opciones">' +
       grupos.map(function (g) {
         var filas = g.items.map(function (i) { return '<tr><td>' + esc(i[0]) + '</td><td class="num">' + esc(i[1]) + '</td><td class="num">' + (i[2] ? clp(i[2]) : 'incluido') + '</td></tr>'; }).join('');
         var control = g.opcional ? '<input type="checkbox" id="g-' + g.id + '" data-grupo="' + g.id + '"' + (g.marcado === false ? '' : ' checked') + '>' : '<span class="fijo" aria-hidden="true"></span>';
         var paso = g.cantidad ? '<span class="paso-cant"><button type="button" data-menos="' + g.id + '" aria-label="Menos ' + esc(g.cantidad.etiqueta) + '">−</button><output class="num" id="c-' + g.id + '">' + cant[g.id] + '</output><button type="button" data-mas="' + g.id + '" aria-label="Más ' + esc(g.cantidad.etiqueta) + '">+</button><small>' + esc(g.cantidad.etiqueta) + '</small></span>' : '';
         return '<div><' + (g.opcional ? 'label' : 'div') + ' class="opcion' + (g.opcional ? '' : ' fija') + '">' + control +
           '<span><b>' + esc(g.nombre) + '</b><small>' + esc(g.detalle || '') + '</small>' + paso + '</span>' +
           '<span class="monto num"><span id="m-' + g.id + '"></span><small>' + (g.pago === 'mensual' ? 'neto al mes' : 'neto, pago único') + '</small></span></' + (g.opcional ? 'label' : 'div') + '>' +
           '<details class="detalle"><summary>Ver detalle</summary><div class="tabla"><table><thead><tr><th>Ítem</th><th>Cant.</th><th>Valor neto</th></tr></thead><tbody>' + filas + '</tbody></table></div></details></div>';
       }).join('') + '</div><div id="aviso"></div><div class="totales-grid" id="totales"></div></section>';

  h += '<section class="sec" id="nws"><div class="sec-cab"><div class="etiqueta">Por qué NWS</div><h2>NetWatch Solutions</h2><p>Seguridad · Conectividad · Continuidad operacional</p></div><div class="porque">' +
       P.porque.map(function (p) { return '<div><b>' + esc(p.v) + '</b><small>' + esc(p.d) + '</small></div>'; }).join('') + '</div>' +
       '<div class="condiciones">' + P.condiciones.map(function (c) { return '<div><span>' + esc(c[0]) + '</span>' + esc(c[1]) + '</div>'; }).join('') + '</div>' +
       '<div class="docs">' + P.documentos.map(function (d) { return '<a class="btn" href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.nombre) + '</a>'; }).join('') + '</div></section>';

  h += '<section class="sec" id="aceptar"><div class="sec-cab"><div class="etiqueta">Aceptación</div><h2>Aceptar la propuesta</h2><p>' + esc(P.aceptar_texto || 'Complete los datos de facturación y envíe la aceptación por WhatsApp o correo. Con eso emitimos la orden de trabajo y coordinamos fechas.') + '</p></div>' +
       '<form class="aceptar" id="form-aceptar" novalidate>' +
         '<label for="f-nombre">Nombre de quien acepta<input id="f-nombre" name="nombre" autocomplete="name"></label>' +
         '<label for="f-cargo">Cargo<input id="f-cargo" name="cargo" autocomplete="organization-title"></label>' +
         '<label for="f-razon">Razón social<input id="f-razon" name="razon" autocomplete="organization"></label>' +
         '<label for="f-rut">RUT<input id="f-rut" name="rut" placeholder="76.123.456-7"></label>' +
         '<label for="f-nota" class="ancho">Comentarios (opcional)<textarea id="f-nota" name="nota" rows="2"></textarea></label>' +
         '<div class="ancho"><button class="btn primario" type="submit">Preparar aceptación</button></div>' +
       '</form>' +
       '<div class="confirma" id="confirma" hidden><p><b>Revise el mensaje y envíelo por el canal que prefiera:</b></p><pre id="mensaje"></pre><div class="acciones">' +
         '<a class="btn primario" id="por-wa" target="_blank" rel="noopener">Enviar por WhatsApp</a><a class="btn" id="por-mail">Enviar por correo</a><button class="btn" type="button" id="copiar">Copiar mensaje</button></div>' +
         '<small style="color:var(--suave)">También puede escribir a ' + esc(P.nws.email) + ' o al ' + esc(P.nws.fono) + '.</small></div>' +
       '<div class="contacto"><div class="persona"><div class="avatar">' + P.nws.nombre.split(' ').map(function (w) { return w[0]; }).join('') + '</div><div><b style="color:var(--tinta)">' + esc(P.nws.nombre) + '</b><br><small style="color:var(--suave)">' + esc(P.nws.cargo) + ' · ' + esc(P.nws.email) + ' · ' + esc(P.nws.fono) + '</small></div></div></div></section>';

  h += '<p class="pie">NetWatch Solutions SpA · RUT 77.859.162-6 · www.nws.cl · Propuesta ' + esc(P.numero) + (P.erp ? ' (' + esc(P.erp) + ')' : '') + '</p>';
  document.getElementById('cuerpo').innerHTML = h;

  /* Cálculo en vivo */
  var D = P.inversion.descuento, estado = {};
  function activo(g) { var c = document.getElementById('g-' + g.id); return !g.opcional || (c && c.checked); }
  function calcular() {
    var act = grupos.filter(activo);
    var unico = act.filter(function (g) { return g.pago !== 'mensual'; }).reduce(function (a, g) { return a + netoGrupo(g); }, 0);
    var mensual = act.filter(function (g) { return g.pago === 'mensual'; }).reduce(function (a, g) { return a + netoGrupo(g); }, 0);
    var cumple = D && (D.requiere || []).every(function (id) { return act.some(function (g) { return g.id === id; }); });
    var desc = cumple ? D.monto : 0;
    unico -= desc;
    grupos.forEach(function (g) { document.getElementById('m-' + g.id).textContent = clp(netoGrupo(g)); if (g.cantidad) document.getElementById('c-' + g.id).textContent = cant[g.id]; });
    var bloque = function (titulo, filas, n, nota) {
      var iva = Math.round(n * 0.19);
      return '<div class="resumen-precio num"><div class="tit-total">' + titulo + '</div>' + filas +
        '<div class="fila"><span>Total neto</span><span>' + clp(n) + '</span></div><div class="fila"><span>IVA 19 %</span><span>' + clp(iva) + '</span></div>' +
        '<div class="fila total"><span>Total</span><span>' + clp(n + iva) + '</span></div>' + (nota ? '<small class="nota">' + esc(nota) + '</small>' : '') + '</div>';
    };
    var fila = function (g) { return '<div class="fila"><span>' + esc(g.nombre) + (g.cantidad ? ' (' + cant[g.id] + ')' : '') + '</span><span>' + clp(netoGrupo(g)) + '</span></div>'; };
    var html = '';
    var gu = act.filter(function (g) { return g.pago !== 'mensual'; }), gm = act.filter(function (g) { return g.pago === 'mensual'; });
    if (gu.length) html += bloque(gm.length ? 'Pago único' : 'Inversión', gu.map(fila).join('') + (desc ? '<div class="fila desc"><span>' + esc(D.texto) + '</span><span>−' + clp(desc) + '</span></div>' : ''), unico, P.inversion.nota_unico);
    if (gm.length) html += bloque('Mensualidad', gm.map(fila).join(''), mensual, P.inversion.nota_mensual);
    if (!act.length) html = '<div class="resumen-precio"><div class="fila"><span>Marque al menos una opción.</span></div></div>';
    document.getElementById('totales').innerHTML = html;
    document.getElementById('aviso').innerHTML = D && act.length ? (cumple ? '<p class="aviso">Incluye ' + esc(D.texto.toLowerCase()) + ': −' + clp(D.monto) + ' neto.</p>' : '<p class="aviso no">' + esc(D.texto) + ': ' + clp(D.monto) + ' neto si adjudica todas las opciones.</p>') : '';
    var principal = gu.length ? unico : mensual;
    document.getElementById('barra-total').textContent = act.length ? clp(Math.round(principal * 1.19)) + (gm.length && gu.length ? ' + ' + clp(Math.round(mensual * 1.19)) + '/mes' : gm.length ? '/mes' : '') : '—';
    document.getElementById('barra-etq').textContent = gm.length && gu.length ? 'Pago único + mensualidad · con IVA' : gm.length ? 'Mensualidad con IVA' : 'Total con IVA';
    estado = { act: act, unico: unico, mensual: mensual };
  }
  document.querySelectorAll('[data-grupo]').forEach(function (c) { c.addEventListener('change', calcular); });
  document.querySelectorAll('[data-mas],[data-menos]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var id = b.dataset.mas || b.dataset.menos, g = grupos.filter(function (x) { return x.id === id; })[0];
      cant[id] = Math.max(g.cantidad.min || 1, cant[id] + (b.dataset.mas ? 1 : -1)); calcular();
    });
  });
  calcular();

  /* Aceptación */
  var form = document.getElementById('form-aceptar');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, falta = ['nombre', 'razon', 'rut'].filter(function (k) { return !f[k].value.trim(); });
    if (falta.length) { var el = f[falta[0]]; el.setCustomValidity('Complete este dato'); el.reportValidity(); el.focus(); el.setCustomValidity(''); return; }
    if (!estado.act.length) { location.hash = '#inversion'; return; }
    var lineas = estado.act.map(function (g) { return '- ' + g.nombre + (g.cantidad ? ': ' + cant[g.id] + ' ' + g.cantidad.etiqueta : ''); });
    var txt = 'Aceptación de propuesta ' + P.numero + '\n' + lineas.join('\n') + '\n' +
      (estado.unico ? 'Pago único: ' + clp(estado.unico) + ' neto + IVA\n' : '') +
      (estado.mensual ? 'Mensualidad: ' + clp(estado.mensual) + ' neto + IVA\n' : '') +
      'Razón social: ' + f.razon.value.trim() + '\nRUT: ' + f.rut.value.trim() + '\n' +
      'Acepta: ' + f.nombre.value.trim() + (f.cargo.value.trim() ? ', ' + f.cargo.value.trim() : '') +
      (f.nota.value.trim() ? '\nComentarios: ' + f.nota.value.trim() : '');
    document.getElementById('mensaje').textContent = txt;
    document.getElementById('por-wa').href = 'https://wa.me/' + P.nws.wa + '?text=' + encodeURIComponent(txt);
    document.getElementById('por-mail').href = 'mailto:' + P.nws.email + '?subject=' + encodeURIComponent('Aceptación ' + P.numero) + '&body=' + encodeURIComponent(txt);
    var c = document.getElementById('confirma'); c.hidden = false; c.scrollIntoView({ block: 'nearest' });
  });
  document.getElementById('copiar').addEventListener('click', function () {
    var t = document.getElementById('mensaje').textContent, b = this;
    var sel = function () { var r = document.createRange(); r.selectNodeContents(document.getElementById('mensaje')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(t).then(function () { b.textContent = 'Copiado'; }, sel); } catch (e) { sel(); }
  });

  /* Sección activa en el menú */
  var links = Array.prototype.slice.call(document.querySelectorAll('.top nav a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  addEventListener('scroll', function () {
    var y = scrollY + 120, i = secs.length - 1;
    while (i > 0 && secs[i].offsetTop > y) i--;
    links.forEach(function (a, k) { a.classList.toggle('on', k === i); });
  }, { passive: true });
})();
