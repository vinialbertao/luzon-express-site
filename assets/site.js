(function () {
  'use strict';
  var WA = '5519997718099';
  var LIME = '#6CC24A';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1000, H = 724;

  var REGIONS = [
    { code: 'R1', name: 'Campinas', cities: ['Campinas', 'Paulínia', 'Sumaré', 'Hortolândia', 'Monte Mor'] },
    { code: 'R2', name: 'Indaiatuba', cities: ['Indaiatuba', 'Salto', 'Itu'] },
    { code: 'R3', name: 'Cosmópolis', cities: ['Cosmópolis', 'Artur Nogueira', 'Engenheiro Coelho', 'Holambra'] },
    { code: 'R4', name: 'Mogi Mirim', cities: ['Mogi Mirim', 'Mogi Guaçu', 'Conchal', 'Itapira'] },
    { code: 'R5', name: 'Jaguariúna', cities: ['Santo Antônio de Posse', 'Jaguariúna', 'Pedreira'] },
    { code: 'R6', name: 'Amparo', cities: ['Amparo', 'Monte Alegre do Sul', 'Serra Negra'] },
    { code: 'R7', name: 'Limeira', cities: ['Limeira', 'Rio Claro', 'Iracemápolis', 'Ipeúna', 'Santa Gertrudes', 'Araras'] },
    { code: 'R8', name: 'Americana', cities: ['Americana', 'Santa Bárbara d’Oeste', 'Nova Odessa'] },
    { code: 'R9', name: 'Piracicaba', cities: ['Piracicaba', 'Saltinho', 'Rio das Pedras', 'Águas de São Pedro', 'Charqueada'] },
    { code: 'R10', name: 'Capivari', cities: ['Capivari', 'Rafard', 'Mombuca', 'Elias Fausto'] },
    { code: 'R11', name: 'Jundiaí', cities: ['Jundiaí', 'Itupeva', 'Louveira'] },
    { code: 'R12', name: 'Valinhos', cities: ['Valinhos', 'Vinhedo', 'Itatiba', 'Morungaba'] },
    { code: 'R13', name: 'Bragança', cities: ['Bragança Paulista', 'Tuiuti', 'Pinhalzinho', 'Pedra Bela', 'Vargem', 'Joanópolis', 'Piracaia'] }
  ];

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Mapa ----------
  var svg = document.getElementById('map-svg');
  var box = document.getElementById('map');
  var pop = document.getElementById('pop');
  var chipsBox = document.getElementById('chips');
  var loading = document.getElementById('map-loading');
  var inset = document.getElementById('inset');
  var geo = null, active = null, shapes = {}, labels = {}, chips = {};

  REGIONS.forEach(function (r) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = r.code + ' · ' + r.name;
    b.setAttribute('aria-label', 'Região ' + r.code + ', ' + r.name + ': ' + r.cities.join(', '));
    b.addEventListener('click', function () { select(r.code); });
    b.addEventListener('mouseenter', function () { select(r.code); });
    b.addEventListener('focus', function () { select(r.code); });
    chipsBox.appendChild(b);
    chips[r.code] = b;
  });

  function select(code) {
    if (!geo || active === code) return;
    if (active) paint(active, false);
    active = code;
    if (code) paint(code, true);
    showPop(code);
  }
  function paint(code, on) {
    if (shapes[code]) shapes[code].setAttribute('fill', on ? LIME : geo.regions[code].shade);
    if (labels[code]) labels[code].setAttribute('fill', on ? '#07100B' : '#FFFFFF');
    if (chips[code]) chips[code].classList.toggle('on', on);
  }
  function showPop(code) {
    if (!code) { pop.classList.remove('show'); return; }
    var r = REGIONS.filter(function (x) { return x.code === code; })[0];
    var g = geo.regions[code];
    var cx = g.cx / W * 100, cy = g.cy / H * 100;
    pop.innerHTML =
      '<div class="head"><span class="code">' + esc(r.code) + '</span><span class="name">' + esc(r.name) +
      '</span><span class="count">' + r.cities.length + ' cidades</span></div><div class="cities">' +
      r.cities.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
    pop.style.left = cx + '%';
    pop.style.top = cy + '%';
    var tx = cx < 30 ? '-20%' : (cx > 70 ? '-80%' : '-50%');
    var ty = cy < 38 ? '26px' : 'calc(-100% - 26px)';
    pop.style.transform = 'translate(' + tx + ',' + ty + ')';
    pop.classList.add('show');
  }

  box.addEventListener('mouseleave', function () { select(null); });
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && !chipsBox.contains(e.target)) select(null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') select(null); });

  function draw(g) {
    geo = g;
    el('path', { d: g.neigh, fill: '#E6E3DA', stroke: '#FFFFFF', 'stroke-width': '1' }, svg);
    REGIONS.forEach(function (r) {
      var p = el('path', { d: g.regions[r.code].d, fill: g.regions[r.code].shade, stroke: '#FFFFFF', 'stroke-opacity': '0.35', 'stroke-width': '0.8', 'class': 'reg' }, svg);
      p.addEventListener('mouseenter', function () { select(r.code); });
      p.addEventListener('click', function (e) { e.stopPropagation(); select(r.code); });
      shapes[r.code] = p;
    });
    el('path', { d: g.outline, fill: 'none', stroke: '#FFFFFF', 'stroke-width': '2.5', 'stroke-linecap': 'round', 'pointer-events': 'none' }, svg);
    REGIONS.forEach(function (r) {
      var t = el('text', { x: g.regions[r.code].cx, y: g.regions[r.code].cy + 9, fill: '#FFFFFF', 'class': 'lbl' }, svg);
      t.textContent = r.code;
      labels[r.code] = t;
    });
    el('circle', { cx: g.bx, cy: g.by, r: '10', fill: '#FFFFFF', stroke: '#07100B', 'stroke-width': '4', 'pointer-events': 'none' }, svg);
    el('path', { d: g.insetD, fill: 'none', stroke: '#C8E0CF', 'stroke-width': '1.4', 'stroke-linecap': 'round' }, inset);
    el('rect', { x: g.rx, y: g.ry, width: g.rw, height: g.rh, rx: '4', fill: LIME, 'fill-opacity': '0.9' }, inset);
    loading.remove();
  }

  fetch('assets/mapa.json')
    .then(function (r) { return r.json(); })
    .then(draw)
    .catch(function () { loading.textContent = 'Não foi possível carregar o mapa.'; });

  // ---------- Formulário de cotação ----------
  var form = document.getElementById('quote');
  var msg = document.getElementById('quote-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var nome = f.nome.value.trim(), origem = f.origem.value.trim(), destino = f.destino.value.trim();
    var missing = [];
    if (!nome) missing.push(f.nome);
    if (!origem) missing.push(f.origem);
    if (!destino) missing.push(f.destino);
    if (missing.length) {
      msg.textContent = 'Preencha nome, origem e destino para montar a cotação.';
      msg.style.color = '#B42318';
      missing[0].focus();
      return;
    }
    msg.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta. É só enviar.';
    msg.style.color = '';
    var lines = [
      'Olá, Luzon Express! Gostaria de uma cotação.',
      '',
      '*Nome/Empresa:* ' + nome,
      f.fone.value.trim() ? '*WhatsApp:* ' + f.fone.value.trim() : null,
      '*Origem:* ' + origem,
      '*Destino:* ' + destino,
      '*Serviço:* ' + f.servico.value,
      f.carga.value.trim() ? '*Sobre a carga:* ' + f.carga.value.trim() : null
    ].filter(function (l) { return l !== null; });
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });
})();
