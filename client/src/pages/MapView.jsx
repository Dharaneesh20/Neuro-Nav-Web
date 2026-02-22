import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiFilter, FiNavigation, FiClock, FiX,
  FiSearch, FiChevronRight, FiCalendar, FiTrendingUp,
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

  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState(ALL_FILTER);
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' | 'history'

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
              className={`mv-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FiClock size={15} /> Trip History
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
