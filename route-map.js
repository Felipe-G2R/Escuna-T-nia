// Escuna Tânia · Mapa Leaflet do roteiro
// Polyline marítima com 6 paradas + waypoints intermediários (contorna ilhas)
// Coordenadas reais — OpenStreetMap Nominatim + Marinha do Brasil + guias de Paraty
(function () {
  if (typeof L === 'undefined') return;
  var el = document.getElementById('route-map');
  if (!el) return;

  var stops, marina, waypoints;
  try {
    stops = JSON.parse(el.getAttribute('data-stops'));
    marina = JSON.parse(el.getAttribute('data-marina'));
    waypoints = JSON.parse(el.getAttribute('data-waypoints') || '{}');
  } catch (e) {
    console.error('Falha ao ler dados do mapa:', e);
    return;
  }

  var map = L.map(el, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
    dragging: !L.Browser.mobile,
    tap: true
  });

  el.addEventListener('mouseenter', function () { map.scrollWheelZoom.enable(); });
  el.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });
  el.addEventListener('touchstart', function () { map.dragging.enable(); });

  // Tile satélite — Esri World Imagery (sem chave)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri · Maxar, Earthstar Geographics · Coords: OSM Nominatim + Marinha do Brasil'
  }).addTo(map);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18, opacity: 0.85
  }).addTo(map);

  // ====== ROTA MARÍTIMA — concatena waypoints reais ======
  // Ordem: Marina → 01 → 02 → 03 → 04 → 05 → 06 → Marina (volta)
  function appendSegment(arr, from, wps, to) {
    arr.push([from.lat, from.lng]);
    if (wps && wps.length) wps.forEach(function (w) { arr.push(w); });
    arr.push([to.lat, to.lng]);
  }

  var nodes = [];
  appendSegment(nodes, marina,   waypoints.marina_to_01, stops[0]);
  appendSegment(nodes, stops[0], waypoints['01_to_02'],  stops[1]);
  appendSegment(nodes, stops[1], waypoints['02_to_03'],  stops[2]);
  appendSegment(nodes, stops[2], waypoints['03_to_04'],  stops[3]);
  appendSegment(nodes, stops[3], waypoints['04_to_05'],  stops[4]);
  appendSegment(nodes, stops[4], waypoints['05_to_06'],  stops[5]);
  appendSegment(nodes, stops[5], waypoints['06_to_marina'], marina);

  // Remove duplicatas consecutivas (paradas aparecem 2x na concatenação)
  var routeCoords = nodes.filter(function (p, i) {
    if (i === 0) return true;
    return !(p[0] === nodes[i-1][0] && p[1] === nodes[i-1][1]);
  });

  // ====== SUAVIZAÇÃO Catmull-Rom — gera curvas naturais entre os pontos ======
  function catmullRom(points, segments) {
    if (points.length < 2) return points;
    segments = segments || 12;
    var smooth = [];
    var n = points.length;
    for (var i = 0; i < n - 1; i++) {
      var p0 = points[i === 0 ? 0 : i - 1];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2 >= n ? n - 1 : i + 2];
      for (var t = 0; t < segments; t++) {
        var s = t / segments;
        var s2 = s * s, s3 = s2 * s;
        var lat = 0.5 * (
          (2 * p1[0]) +
          (-p0[0] + p2[0]) * s +
          (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * s2 +
          (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * s3
        );
        var lng = 0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * s +
          (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * s2 +
          (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * s3
        );
        smooth.push([lat, lng]);
      }
    }
    smooth.push(points[points.length - 1]);
    return smooth;
  }

  var smoothCoords = catmullRom(routeCoords, 14);

  // Outline branco translúcido (efeito "rastro espumante")
  L.polyline(smoothCoords, {
    color: 'rgba(255,255,255,0.55)',
    weight: 7,
    opacity: 0.75,
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(map);

  // Linha borgonha principal — tracejada
  L.polyline(smoothCoords, {
    color: 'rgb(115,35,60)',
    weight: 3,
    opacity: 0.95,
    dashArray: '8 10',
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(map);

  // Marker Marina
  var marinaIcon = L.divIcon({
    className: 'marina-pin',
    html: '<div class="marina-dot"><span>SAÍDA</span></div>',
    iconSize: [70, 28], iconAnchor: [35, 14]
  });
  L.marker([marina.lat, marina.lng], { icon: marinaIcon, keyboard: false, interactive: false }).addTo(map);

  // Marcadores numerados das 6 paradas
  stops.forEach(function (s) {
    var pinIcon = L.divIcon({
      className: 'stop-pin',
      html: '<div class="stop-pin-circle">' + s.n + '</div>',
      iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -22]
    });
    var marker = L.marker([s.lat, s.lng], { icon: pinIcon, title: s.name, riseOnHover: true }).addTo(map);

    var popupHtml =
      '<div class="stop-pop">' +
        '<div class="stop-pop-img" style="background-image:url(\'' + s.img + '\');"></div>' +
        '<div class="stop-pop-body">' +
          '<div class="stop-pop-head">' +
            '<strong>' + s.name + '</strong>' +
            '<span class="stop-pop-tag">' + s.time + ' · ' + s.tag + '</span>' +
          '</div>' +
          '<p>' + s.desc + '</p>' +
        '</div>' +
      '</div>';

    marker.bindPopup(popupHtml, {
      maxWidth: 320, minWidth: 260,
      className: 'stop-popup',
      closeButton: true, autoPan: true, autoPanPadding: [40, 40]
    });
    marker.on('mouseover', function () { marker.openPopup(); });
    marker.on('click',     function () { marker.openPopup(); });
  });

  // Enquadra o roteiro inteiro
  var bounds = L.latLngBounds(smoothCoords).pad(0.10);
  map.fitBounds(bounds, { padding: [24, 24] });
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
