import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiFilter, FiNavigation, FiClock, FiX,
  FiSearch, FiChevronRight, FiCalendar, FiTrendingUp,
  FiWind, FiEye, FiEyeOff, FiAlertTriangle,
} from 'react-icons/fi';
import { routeAPI } from '../services/api';
import '../styles/pages/MapView.css';

const GMAP_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/* ── singleton Maps loader (display only, no Places library needed) ── */
const loadGoogleMaps = (() => {
  let p = null;
  return () => {
    if (p) return p;
    if (window.google?.maps) return Promise.resolve();
    p = new Promise((resolve, reject) => {
      const cb = '__gmaps_mapview_cb';
      window[cb] = () => { resolve(); delete window[cb]; };
      const s = document.createElement('script');
      s.setAttribute('data-gmaps', '1');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&callback=${cb}`;
      s.async = true; s.defer = true;
      s.onerror = () => { p = null; reject(new Error('Google Maps failed to load')); };
      document.head.appendChild(s);
    });
    return p;
  };
})();

/* ── AQI helpers ─────────────────────────────────────────── */
const WAQI_TOKEN = process.env.REACT_APP_WAQI_TOKEN || 'demo';

const AQI_LEVELS = [
  { max: 50,  label: 'Good',              color: '#00c851', bg: '#e8fff0', emoji: '😊', tip: 'Air quality is great. Ideal for outdoor activities.' },
  { max: 100, label: 'Moderate',          color: '#e6b800', bg: '#fffde7', emoji: '😐', tip: 'Acceptable. Unusually sensitive individuals may experience minor symptoms.' },
  { max: 150, label: 'Unhealthy (S.G.)',  color: '#ff8800', bg: '#fff3e0', emoji: '😷', tip: 'Sensitive groups are at risk. Limit prolonged outdoor exertion.' },
  { max: 200, label: 'Unhealthy',         color: '#f44336', bg: '#fde8e8', emoji: '🚫', tip: 'Everyone may begin to experience health effects. Reduce outdoor time.' },
  { max: 300, label: 'Very Unhealthy',    color: '#9c27b0', bg: '#f3e8ff', emoji: '⚠️', tip: 'Health alert. Avoid this area if possible.' },
  { max: 500, label: 'Hazardous',         color: '#7d0023', bg: '#ffe4e4', emoji: '☠️', tip: 'Emergency conditions. Do NOT go outside.' },
];

const getAQILevel = (aqiVal) =>
  AQI_LEVELS.find(l => aqiVal <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];

const fetchAQIData = async (lat, lng) => {
  const res = await fetch(
    `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_TOKEN}`
  );
  const data = await res.json();
  return data.status === 'ok' ? data.data : null;
};

/* ── Nearby place categories (OpenStreetMap / Overpass) ──── */
const PLACE_TYPES = [
  { osm: 'amenity=cafe',             label: 'Café',          icon: '☕', color: '#a16207', bg: '#fef3c7' },
  { osm: 'leisure=park',             label: 'Park',          icon: '🌳', color: '#15803d', bg: '#dcfce7' },
  { osm: 'amenity=place_of_worship', label: 'Temple/Church', icon: '🛕', color: '#b45309', bg: '#fef9c3' },
  { osm: 'amenity=library',          label: 'Library',       icon: '📚', color: '#1d4ed8', bg: '#dbeafe' },
  { osm: 'amenity=hospital',         label: 'Hospital',      icon: '🏥', color: '#dc2626', bg: '#fee2e2' },
  { osm: 'amenity=restaurant',       label: 'Restaurant',    icon: '🍽️', color: '#ea580c', bg: '#ffedd5' },
];

const ALL_FILTER = 'All';

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fetchNearbyPlaces = async (lat, lng, radius = 6000) => {
  const results = await Promise.allSettled(
    PLACE_TYPES.map(async (t) => {
      const [k, v] = t.osm.split('=');
      const query =
        `[out:json][timeout:25];(node["${k}"="${v}"](around:${radius},${lat},${lng});` +
        `way["${k}"="${v}"](around:${radius},${lat},${lng}););out body center 10;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      return (data.elements || []).slice(0, 10).map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;
        return {
          id: `${el.id}_${t.label}`,
          placeId: String(el.id),
          name: el.tags?.name || t.label,
          type: t.label,
          icon: t.icon,
          color: t.color,
          bg: t.bg,
          lat: elLat,
          lng: elLng,
          distance: haversineKm(lat, lng, elLat, elLng).toFixed(1),
          address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], el.tags?.['addr:city']]
            .filter(Boolean).join(', '),
        };
      }).filter(Boolean);
    })
  );

  const seen = new Set();
  const all = [];
  results.forEach(({ value }) => {
    (value || []).forEach((p) => {
      if (!seen.has(p.placeId)) { seen.add(p.placeId); all.push(p); }
    });
  });
  return all.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
};

/* ─────────────────────────────────────────────────────────── */
const MapView = () => {
  const mapRef = useRef(null);
  const gmapRef = useRef(null);
  const infoWinRef = useRef(null);
  const markersRef = useRef({});     // id → google.maps.Marker
  const aqiLayerRef = useRef(null);  // WAQI tile overlay

  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState(ALL_FILTER);
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' | 'history' | 'air'

  // AQI state
  const [aqiData, setAqiData] = useState(null);
  const [aqiLoading, setAqiLoading] = useState(false);
  const [showAqiLayer, setShowAqiLayer] = useState(true);

  /* ── Get user location ─────────────────────────────────── */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setLocation({ lat: 13.0827, lng: 80.2707 }), // Chennai fallback
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Init Google Map ──────────────────────────────────────*/
  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      if (gmapRef.current) { gmapRef.current.panTo(location); return; }

      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      });
      gmapRef.current = map;
      infoWinRef.current = new window.google.maps.InfoWindow();

      // ── WAQI AQI tile overlay ──────────────────────────────
      const tileLayer = new window.google.maps.ImageMapType({
        getTileUrl: (coord, zoom) =>
          `https://tiles.waqi.info/tiles/usepa-aqi/${zoom}/${coord.x}/${coord.y}.png?token=${WAQI_TOKEN}`,
        tileSize: new window.google.maps.Size(256, 256),
        opacity: 0.65,
        name: 'AQI',
      });
      map.overlayMapTypes.push(tileLayer);
      aqiLayerRef.current = tileLayer;

      // Fetch nearest AQI station data
      setAqiLoading(true);
      fetchAQIData(location.lat, location.lng)
        .then(d => { if (!cancelled) { setAqiData(d); setAqiLoading(false); } })
        .catch(() => { if (!cancelled) setAqiLoading(false); });

      // User marker
      new window.google.maps.Marker({
        position: location, map,
        title: 'You are here',
        zIndex: 999,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#6366f1', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
      });

      setLoadingMap(false);

      // Fetch nearby places via Overpass / OpenStreetMap (no billing required)
      setLoadingPlaces(true);
      fetchNearbyPlaces(location.lat, location.lng, 6000).then(ps => {
        if (cancelled) return;
        setPlaces(ps);
        setLoadingPlaces(false);
        ps.forEach(p => addMarker(map, p));
      }).catch(() => {
        if (!cancelled) setLoadingPlaces(false);
      });
    }).catch(() => setLoadingMap(false));

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng]);

  /* ── Add a place marker ───────────────────────────────── */
  const addMarker = (map, place) => {
    const marker = new window.google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      title: place.name,
      label: { text: place.icon, fontSize: '16px' },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: place.bg, fillOpacity: 0.9,
        strokeColor: place.color, strokeWeight: 2,
      },
    });
    marker.addListener('click', () => {
      setSelectedPlace(place);
      openInfoWindow(map, marker, place);
    });
    markersRef.current[place.id] = marker;
  };

  const openInfoWindow = (map, marker, place) => {
    const openTag = place.open === true ? '<span style="color:#16a34a;font-size:11px;font-weight:600">● Open now</span>'
      : place.open === false ? '<span style="color:#dc2626;font-size:11px;font-weight:600">● Closed</span>' : '';
    const ratingTag = place.rating ? `<span style="font-size:11px;color:#f59e0b">★ ${place.rating}</span>` : '';
    infoWinRef.current.setContent(`
      <div style="padding:8px 4px;max-width:220px;font-family:sans-serif">
        <b style="font-size:14px">${place.icon} ${place.name}</b>
        <p style="margin:4px 0 2px;font-size:12px;color:#555">${place.type}</p>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">${ratingTag}${openTag}</div>
        <p style="margin:0;font-size:12px;color:#6366f1;font-weight:600">${place.distance} km away</p>
        ${place.address ? `<p style="margin:4px 0 0;font-size:11px;color:#888">${place.address}</p>` : ''}
      </div>
    `);
    infoWinRef.current.open(map, marker);
  };

  /* ── Pan to a place card ──────────────────────────────── */
  const focusPlace = useCallback((place) => {
    setSelectedPlace(place);
    const map = gmapRef.current;
    if (!map) return;
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(17);
    const marker = markersRef.current[place.id];
    if (marker) openInfoWindow(map, marker, place);
  }, []); // eslint-disable-line

  /* ── Toggle AQI overlay ───────────────────────────────── */
  const toggleAqiLayer = useCallback(() => {
    const map = gmapRef.current;
    if (!map || !aqiLayerRef.current) return;
    if (showAqiLayer) {
      map.overlayMapTypes.clear();
    } else {
      map.overlayMapTypes.push(aqiLayerRef.current);
    }
    setShowAqiLayer(prev => !prev);
  }, [showAqiLayer]);

  /* ── Fetch trip history ───────────────────────────────── */
  useEffect(() => {
    routeAPI.getRoutes(20, 0).then(res => {
      setTripHistory(res.data || []);
    }).catch(() => setTripHistory([])).finally(() => setLoadingHistory(false));
  }, []);

  /* ── Filtered places ──────────────────────────────────── */
  const filteredPlaces = places.filter(p => {
    const matchFilter = filter === ALL_FILTER || p.type === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterTabs = [ALL_FILTER, ...PLACE_TYPES.map(t => t.label)];

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mv-page">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div className="mv-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="mv-title">Safe Spaces Map</h1>
          <p className="mv-subtitle">Real-time sensory-friendly locations near you</p>
        </div>
        {location && (
          <div className="mv-location-pill">
            <FiMapPin size={14} />
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}
      </motion.div>

      {/* ── Map + Sidebar ──────────────────────────────── */}
      <div className="mv-body">
        {/* Map */}
        <div className="mv-map-wrap">
          <div ref={mapRef} className="mv-map" />
          {loadingMap && (
            <div className="mv-map-overlay">
              <div className="mv-spinner" />
              <p>Loading map…</p>
            </div>
          )}

          {/* AQI layer toggle button */}
          {!loadingMap && (
            <button
              className={`mv-aqi-toggle ${showAqiLayer ? 'active' : ''}`}
              onClick={toggleAqiLayer}
              title={showAqiLayer ? 'Hide AQI layer' : 'Show AQI layer'}
            >
              {showAqiLayer ? <FiEye size={14} /> : <FiEyeOff size={14} />}
              <span>AQI Layer</span>
            </button>
          )}

          {/* Compact AQI badge on map */}
          {!loadingMap && aqiData && (() => {
            const lvl = getAQILevel(aqiData.aqi);
            return (
              <div className="mv-aqi-badge" style={{ background: lvl.bg, borderColor: lvl.color }}>
                <span className="mv-aqi-badge-num" style={{ color: lvl.color }}>{aqiData.aqi}</span>
                <span className="mv-aqi-badge-label" style={{ color: lvl.color }}>AQI</span>
                <span className="mv-aqi-badge-emoji">{lvl.emoji}</span>
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div className="mv-sidebar">
          {/* Tabs */}
          <div className="mv-tabs">
            <button
              className={`mv-tab ${activeTab === 'nearby' ? 'active' : ''}`}
              onClick={() => setActiveTab('nearby')}
            >
              <FiMapPin size={15} /> Nearby
              {places.length > 0 && <span className="mv-tab-badge">{filteredPlaces.length}</span>}
            </button>
            <button
              className={`mv-tab ${activeTab === 'air' ? 'active' : ''}`}
              onClick={() => setActiveTab('air')}
            >
              <FiWind size={15} /> Air Quality
              {aqiData && (() => {
                const lvl = getAQILevel(aqiData.aqi);
                return (
                  <span
                    className="mv-tab-badge"
                    style={{ background: lvl.color, color: '#fff' }}
                  >
                    {aqiData.aqi}
                  </span>
                );
              })()}
            </button>
            <button
              className={`mv-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FiClock size={15} /> History
              {tripHistory.length > 0 && <span className="mv-tab-badge">{tripHistory.length}</span>}
            </button>
          </div>

          {/* ── Nearby tab ─────────────── */}
          {activeTab === 'nearby' && (
            <>
              {/* Search */}
              <div className="mv-search-wrap">
                <FiSearch size={16} className="mv-search-icon" />
                <input
                  className="mv-search"
                  placeholder="Search nearby places…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="mv-search-clear" onClick={() => setSearch('')}>
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Filter chips */}
              <div className="mv-filter-row">
                {filterTabs.map(f => (
                  <button
                    key={f}
                    className={`mv-chip ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f !== ALL_FILTER && PLACE_TYPES.find(t => t.label === f)?.icon + ' '}
                    {f}
                  </button>
                ))}
              </div>

              {/* Place cards */}
              <div className="mv-cards">
                {loadingPlaces ? (
                  <div className="mv-loading-msg">
                    <div className="mv-spinner" /> Fetching nearby places…
                  </div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="mv-empty">No places found nearby.</div>
                ) : (
                  <AnimatePresence>
                    {filteredPlaces.map(p => (
                      <motion.div
                        key={p.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`mv-place-card ${selectedPlace?.id === p.id ? 'selected' : ''}`}
                        onClick={() => focusPlace(p)}
                      >
                        <div className="mv-place-icon" style={{ background: p.bg, color: p.color }}>
                          {p.icon}
                        </div>
                        <div className="mv-place-info">
                          <div className="mv-place-name">{p.name}</div>
                          <div className="mv-place-meta">
                            <span className="mv-place-type" style={{ color: p.color }}>{p.type}</span>
                            <span className="mv-place-dist"><FiMapPin size={11} /> {p.distance} km</span>
                            {p.rating && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>★ {p.rating}</span>}
                            {p.open === true && <span style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 600 }}>Open</span>}
                            {p.open === false && <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600 }}>Closed</span>}
                          </div>
                          {p.address && <div className="mv-place-addr">{p.address}</div>}
                        </div>
                        <FiChevronRight size={16} className="mv-place-arrow" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}

          {/* ── Air Quality tab ────────── */}
          {activeTab === 'air' && (
            <div className="mv-aqi-panel">
              {aqiLoading ? (
                <div className="mv-loading-msg">
                  <div className="mv-spinner" /> Fetching air quality data…
                </div>
              ) : !aqiData ? (
                <div className="mv-empty">
                  <FiWind size={32} opacity={0.3} />
                  <p>No AQI data available for this location.</p>
                </div>
              ) : (() => {
                const lvl = getAQILevel(aqiData.aqi);
                const iaqi = aqiData.iaqi || {};
                const pm25  = iaqi.pm25?.v;
                const pm10  = iaqi.pm10?.v;
                const o3    = iaqi.o3?.v;
                const no2   = iaqi.no2?.v;
                const co    = iaqi.co?.v;
                const so2   = iaqi.so2?.v;
                const isUnhealthy = aqiData.aqi > 100;
                const isDangerous = aqiData.aqi > 150;
                return (
                  <>
                    {/* Main AQI card */}
                    <div className="mv-aqi-main" style={{ background: lvl.bg, borderColor: lvl.color }}>
                      <div className="mv-aqi-circle" style={{ borderColor: lvl.color }}>
                        <span className="mv-aqi-number" style={{ color: lvl.color }}>{aqiData.aqi}</span>
                        <span className="mv-aqi-unit">AQI</span>
                      </div>
                      <div className="mv-aqi-info">
                        <div className="mv-aqi-emoji">{lvl.emoji}</div>
                        <div className="mv-aqi-level" style={{ color: lvl.color }}>{lvl.label}</div>
                        <div className="mv-aqi-station">
                          <FiMapPin size={11} /> {aqiData.city?.name || 'Nearest station'}
                        </div>
                      </div>
                    </div>

                    {/* Avoidance warning */}
                    {isDangerous && (
                      <div className="mv-aqi-warning danger">
                        <FiAlertTriangle size={18} />
                        <div>
                          <strong>Avoid this area</strong>
                          <p>{lvl.tip}</p>
                        </div>
                      </div>
                    )}
                    {isUnhealthy && !isDangerous && (
                      <div className="mv-aqi-warning moderate">
                        <FiAlertTriangle size={18} />
                        <div>
                          <strong>Caution advised</strong>
                          <p>{lvl.tip}</p>
                        </div>
                      </div>
                    )}
                    {!isUnhealthy && (
                      <div className="mv-aqi-warning good">
                        <span style={{ fontSize: '18px' }}>✓</span>
                        <div>
                          <strong>Safe to be outdoors</strong>
                          <p>{lvl.tip}</p>
                        </div>
                      </div>
                    )}

                    {/* Pollutant breakdown */}
                    <div className="mv-aqi-section-title">Pollutant Levels</div>
                    <div className="mv-aqi-pollutants">
                      {[
                        { key: 'PM2.5', val: pm25, unit: 'μg/m³', desc: 'Fine particles', icon: '🌫️', danger: 35 },
                        { key: 'PM10',  val: pm10, unit: 'μg/m³', desc: 'Coarse particles', icon: '💨', danger: 150 },
                        { key: 'O₃',    val: o3,   unit: 'ppb',   desc: 'Ozone (oxygen)', icon: '🌀', danger: 70 },
                        { key: 'NO₂',   val: no2,  unit: 'ppb',   desc: 'Nitrogen dioxide', icon: '🏭', danger: 100 },
                        { key: 'SO₂',   val: so2,  unit: 'ppb',   desc: 'Sulfur dioxide', icon: '⚗️', danger: 75 },
                        { key: 'CO',    val: co,   unit: 'ppm',   desc: 'Carbon monoxide', icon: '🚗', danger: 9 },
                      ].filter(p => p.val !== undefined).map(p => {
                        const pct = Math.min(100, (p.val / (p.danger * 2)) * 100);
                        const barColor = p.val > p.danger ? '#f44336' : p.val > p.danger * 0.5 ? '#ff8800' : '#00c851';
                        return (
                          <div key={p.key} className="mv-aqi-pollutant">
                            <div className="mv-aqi-poll-header">
                              <span className="mv-aqi-poll-icon">{p.icon}</span>
                              <span className="mv-aqi-poll-key">{p.key}</span>
                              <span className="mv-aqi-poll-val" style={{ color: barColor }}>
                                {typeof p.val === 'number' ? p.val.toFixed(1) : p.val} {p.unit}
                              </span>
                            </div>
                            <div className="mv-aqi-bar-bg">
                              <div
                                className="mv-aqi-bar-fill"
                                style={{ width: `${pct}%`, background: barColor }}
                              />
                            </div>
                            <div className="mv-aqi-poll-desc">{p.desc}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AQI legend */}
                    <div className="mv-aqi-section-title">AQI Scale</div>
                    <div className="mv-aqi-legend">
                      {AQI_LEVELS.map(l => (
                        <div
                          key={l.label}
                          className={`mv-aqi-legend-item ${aqiData.aqi <= l.max && (AQI_LEVELS.find(x => aqiData.aqi <= x.max) === l) ? 'current' : ''}`}
                          style={{ borderColor: l.color, background: l.bg }}
                        >
                          <span className="mv-aqi-legend-dot" style={{ background: l.color }} />
                          <span className="mv-aqi-legend-label">{l.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Last updated */}
                    {aqiData.time?.s && (
                      <div className="mv-aqi-updated">
                        <FiClock size={11} /> Updated: {aqiData.time.s}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ── History tab ────────────── */}
          {activeTab === 'history' && (
            <div className="mv-cards">
              {loadingHistory ? (
                <div className="mv-loading-msg">
                  <div className="mv-spinner" /> Loading trips…
                </div>
              ) : tripHistory.length === 0 ? (
                <div className="mv-empty">
                  <FiNavigation size={32} opacity={0.3} />
                  <p>No trips recorded yet.</p>
                  <p className="mv-empty-hint">Use Plan Trip to plan your first route!</p>
                </div>
              ) : (
                tripHistory.map((trip, idx) => {
                  const date = trip.createdAt
                    ? new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';
                  const time = trip.createdAt
                    ? new Date(trip.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <motion.div
                      key={trip._id || idx}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="mv-trip-card"
                    >
                      <div className="mv-trip-icon">
                        <FiNavigation size={18} />
                      </div>
                      <div className="mv-trip-info">
                        <div className="mv-trip-route">
                          <span className="mv-trip-from">{trip.startLocation?.name || trip.origin || 'Origin'}</span>
                          <span className="mv-trip-arrow">→</span>
                          <span className="mv-trip-to">{trip.endLocation?.name || trip.destination || 'Destination'}</span>
                        </div>
                        <div className="mv-trip-meta">
                          <span><FiCalendar size={11} /> {date} {time}</span>
                          {(trip.distance || trip.totalDistance) && (
                            <span><FiTrendingUp size={11} /> {trip.distance || trip.totalDistance} km</span>
                          )}
                          {(trip.duration || trip.estimatedDuration) && (
                            <span><FiClock size={11} /> {trip.duration || trip.estimatedDuration} min</span>
                          )}
                        </div>
                        {trip.status && (
                          <span className={`mv-trip-status ${trip.status}`}>{trip.status}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
