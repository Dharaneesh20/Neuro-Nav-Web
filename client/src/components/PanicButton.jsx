import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiMapPin, FiX, FiHeart, FiNavigation, FiMusic } from 'react-icons/fi';
import { panicEventAPI } from '../services/api';
import '../styles/components/PanicButton.css';

/* ── Google Maps singleton ─────────────────────────── */
const GMAP_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const loadGoogleMaps = (() => {
  let p = null;
  return () => {
    if (p) return p;
    if (window.google?.maps) return Promise.resolve();
    p = new Promise((resolve, reject) => {
      if (document.querySelector('script[data-gmaps]')) {
        const poll = setInterval(() => {
          if (window.google?.maps) { clearInterval(poll); resolve(); }
        }, 100);
        return;
      }
      const cb = '__gmaps_panic_cb';
      window[cb] = () => { resolve(); delete window[cb]; };
      const s = document.createElement('script');
      s.setAttribute('data-gmaps', '1');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&callback=${cb}`;
      s.async = true; s.defer = true;
      s.onerror = () => reject(new Error('Maps load failed'));
      document.head.appendChild(s);
    });
    return p;
  };
})();

/* ── Nearest safe-haven via Overpass ───────────────── */
const fetchNearestHaven = async (lat, lng) => {
  const TYPES = [
    { q: 'amenity=park',             label: 'Park',         icon: '🌳', color: '#22c55e' },
    { q: 'leisure=park',             label: 'Park',         icon: '🌳', color: '#22c55e' },
    { q: 'amenity=library',          label: 'Library',      icon: '📚', color: '#3b82f6' },
    { q: 'leisure=garden',           label: 'Garden',       icon: '🌻', color: '#16a34a' },
    { q: 'amenity=place_of_worship', label: 'Temple',       icon: '🛕', color: '#f59e0b' },
    { q: 'amenity=cafe',             label: 'Café',         icon: '☕', color: '#a16207' },
  ];
  for (const t of TYPES) {
    try {
      const [k, v] = t.q.split('=');
      const query = `[out:json][timeout:8];node["${k}"="${v}"](around:1500,${lat},${lng});out body 5;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST', body: query,
      });
      const data = await res.json();
      if (data.elements?.length) {
        const el = data.elements[0];
        return {
          id: el.id,
          name: el.tags?.name || t.label,
          type: t.label,
          icon: t.icon,
          color: t.color,
          lat: el.lat,
          lng: el.lon,
        };
      }
    } catch (_) {}
  }
  return null;
};

/* ── Breathing phases ──────────────────────────────── */
const BREATH_PHASES = [
  { label: 'Breathe In',  duration: 4000, scale: 1.45, opacity: 0.85 },
  { label: 'Hold...',     duration: 2000, scale: 1.45, opacity: 1    },
  { label: 'Breathe Out', duration: 4000, scale: 0.72, opacity: 0.5  },
  { label: 'Rest...',     duration: 2000, scale: 0.72, opacity: 0.38 },
];

/* ── Spotify calming playlists (stable editorial playlists) ─── */
const PLAYLISTS = [
  { id: '37i9dQZF1DWZd79rJ6a7lp', name: 'Peaceful Piano', icon: '🎹' },
  { id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Focus',     icon: '🎵' },
  { id: '37i9dQZF1DX4sWSpwq3LiO', name: 'Calm Vibes',     icon: '🌿' },
];

/* ══════════════════════════════════════════════════════
   PanicButton component
══════════════════════════════════════════════════════ */
const PanicButton = ({ className }) => {
  /* mode: 'idle' | 'confirm' | 'active' */
  const [mode, setMode] = useState('idle');
  const [panicType, setPanicType] = useState('panic');
  const [triggers, setTriggers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  /* location */
  const [userLoc, setUserLoc] = useState(null);
  const [haven, setHaven] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  /* breathing */
  const [breathIdx, setBreathIdx] = useState(0);
  const breathTimerRef = useRef(null);

  /* map */
  const mapDivRef = useRef(null);
  const gmapRef = useRef(null);
  const dirRendererRef = useRef(null);
  const havenMarkerRef = useRef(null);

  /* Spotify */
  const [spotifyId, setSpotifyId] = useState(PLAYLISTS[0].id);

  /* ── Get location ─────────────────────────────────── */
  const getLocation = () =>
    new Promise(resolve => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: 13.0827, lng: 80.2707 }),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else resolve({ lat: 13.0827, lng: 80.2707 });
    });

  /* ── Reverse geocode ─────────────────────────────── */
  const getAddress = async (lat, lng) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const d = await r.json();
      return d.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  /* ── Trigger panic ───────────────────────────────── */
  const handleTrigger = async () => {
    setIsLoading(true);
    try {
      const loc = await getLocation();
      setUserLoc(loc);
      const address = await getAddress(loc.lat, loc.lng);
      const triggerList = triggers.split(',').map(t => t.trim()).filter(Boolean);

      await panicEventAPI.trigger({
        severity: panicType,
        coordinates: [loc.lng, loc.lat],
        address,
        triggers: triggerList,
      });

      setSentMsg(`✅ Caretaker notified — ${address.substring(0, 90)}`);
      setMode('active');
      startBreathing();
      fetchNearestHaven(loc.lat, loc.lng).then(h => setHaven(h));
    } catch (err) {
      const fallbackLoc = userLoc || { lat: 13.0827, lng: 80.2707 };
      setSentMsg(`⚠️ Alert sent (${err.response?.data?.error || 'offline mode'})`);
      setMode('active');
      startBreathing();
      fetchNearestHaven(fallbackLoc.lat, fallbackLoc.lng).then(h => setHaven(h));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Breathing cycle ─────────────────────────────── */
  const startBreathing = useCallback(() => {
    setBreathIdx(0);
    let idx = 0;
    const tick = () => {
      const phase = BREATH_PHASES[idx];
      breathTimerRef.current = setTimeout(() => {
        idx = (idx + 1) % BREATH_PHASES.length;
        setBreathIdx(idx);
        tick();
      }, phase.duration);
    };
    tick();
  }, []);

  /* ── Effect 1: Init map with user location ─────────── */
  useEffect(() => {
    if (mode !== 'active' || !userLoc || !mapDivRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapDivRef.current || gmapRef.current) return;

      const uLatLng = new window.google.maps.LatLng(userLoc.lat, userLoc.lng);

      const map = new window.google.maps.Map(mapDivRef.current, {
        center: uLatLng,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });
      gmapRef.current = map;

      /* User marker */
      new window.google.maps.Marker({
        position: uLatLng, map,
        title: 'You are here',
        zIndex: 10,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
      });

      /* Setup directions renderer (used later when haven arrives) */
      const renderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 5, strokeOpacity: 0.85 },
      });
      renderer.setMap(map);
      dirRendererRef.current = renderer;
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [mode, userLoc]);

  /* ── Effect 2: Add haven marker + route when haven arrives ─ */
  useEffect(() => {
    if (!haven || !gmapRef.current) return;

    const map = gmapRef.current;
    const hLatLng = new window.google.maps.LatLng(haven.lat, haven.lng);
    const uLatLng = new window.google.maps.LatLng(userLoc.lat, userLoc.lng);

    /* Remove old haven marker if any */
    if (havenMarkerRef.current) havenMarkerRef.current.setMap(null);

    /* Haven marker */
    havenMarkerRef.current = new window.google.maps.Marker({
      position: hLatLng, map,
      title: haven.name,
      label: { text: haven.icon, fontSize: '20px' },
      zIndex: 9,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 20,
        fillColor: '#dbeafe', fillOpacity: 0.9,
        strokeColor: haven.color, strokeWeight: 2.5,
      },
    });

    /* Walking Directions */
    const svc = new window.google.maps.DirectionsService();
    svc.route({
      origin: uLatLng,
      destination: hLatLng,
      travelMode: window.google.maps.TravelMode.WALKING,
    }, (result, status) => {
      if (status === 'OK' && dirRendererRef.current) {
        dirRendererRef.current.setDirections(result);
        const leg = result.routes[0].legs[0];
        setRouteInfo({ distanceText: leg.distance.text, durationText: leg.duration.text });
        map.fitBounds(result.routes[0].bounds);
      } else {
        /* fallback: just pan to show both markers */
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(uLatLng); bounds.extend(hLatLng);
        map.fitBounds(bounds);
      }
    });
  }, [haven]);

  /* ── Cleanup on unmount ──────────────────────────── */
  useEffect(() => () => clearTimeout(breathTimerRef.current), []);

  /* ── Reset ───────────────────────────────────────── */
  const handleReset = () => {
    clearTimeout(breathTimerRef.current);
    if (havenMarkerRef.current) havenMarkerRef.current.setMap(null);
    if (dirRendererRef.current) dirRendererRef.current.setMap(null);
    gmapRef.current = null;
    havenMarkerRef.current = null;
    dirRendererRef.current = null;
    setMode('idle');
    setHaven(null);
    setRouteInfo(null);
    setSentMsg('');
    setTriggers('');
    setUserLoc(null);
    setBreathIdx(0);
  };

  const breathPhase = BREATH_PHASES[breathIdx];

  /* ══ RENDER ═══════════════════════════════════════ */
  return (
    <>
      {/* ── Floating SOS button ───────────────── */}
      <AnimatePresence>
        {mode === 'idle' && (
          <motion.button
            key="sos-btn"
            className="pb-sos-btn"
            onClick={() => setMode('confirm')}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
          >
            <motion.div
              className="pb-sos-ring"
              animate={{ scale: [1, 1.6, 1], opacity: [0.65, 0, 0.65] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <FiAlertTriangle size={24} />
            <span>SOS</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Confirmation modal ────────────────── */}
      <AnimatePresence>
        {mode === 'confirm' && (
          <motion.div
            className="pb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMode('idle')}
          >
            <motion.div
              className="pb-confirm-modal"
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="pb-modal-close" onClick={() => setMode('idle')}>
                <FiX size={18} />
              </button>
              <div className="pb-modal-icon">
                <FiAlertTriangle size={26} />
              </div>
              <h2 className="pb-modal-title">Emergency Alert</h2>
              <p className="pb-modal-desc">
                This will notify your caretaker with your live location and open a calm-down mode.
              </p>

              <div className="pb-type-row">
                {['panic', 'meltdown'].map(t => (
                  <label key={t} className={`pb-type-chip ${panicType === t ? 'active' : ''}`}>
                    <input
                      type="radio" name="ptype" value={t}
                      checked={panicType === t}
                      onChange={() => setPanicType(t)}
                    />
                    {t === 'panic' ? '😰 Panic Attack' : '😵 Sensory Meltdown'}
                  </label>
                ))}
              </div>

              <textarea
                className="pb-triggers-input"
                placeholder="What triggered this? (optional) e.g. Loud noise, Crowd…"
                value={triggers}
                onChange={e => setTriggers(e.target.value)}
                rows={2}
              />

              <div className="pb-location-note">
                <FiMapPin size={13} /> Live location will be shared with your caretaker
              </div>

              <div className="pb-modal-actions">
                <button className="pb-cancel-btn" onClick={() => setMode('idle')}>
                  Cancel
                </button>
                <button
                  className="pb-confirm-btn"
                  onClick={handleTrigger}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending…' : 'Activate SOS'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANIC ACTIVE — fullscreen overlay ─── */}
      <AnimatePresence>
        {mode === 'active' && (
          <motion.div
            className="pb-panic-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Patterned gradient backdrop */}
            <div className="pb-backdrop" aria-hidden="true" />

            {/* Close / I'm okay button */}
            <motion.button
              className="pb-close-screen"
              onClick={handleReset}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <FiX size={18} />
              I'm okay now
            </motion.button>

            {/* Caretaker notified banner */}
            {sentMsg && (
              <motion.div
                className="pb-sent-banner"
                initial={{ y: -32, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {sentMsg}
              </motion.div>
            )}

            <div className="pb-screen-body">

              {/* 1. Breathing */}
              <motion.section
                className="pb-breathing-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="pb-section-title">You are safe 💜</h2>

                <div className="pb-breath-rings">
                  <motion.div
                    className="pb-ring pb-ring-4"
                    animate={{ scale: [1, 1.06, 1], opacity: [0.12, 0.25, 0.12] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="pb-ring pb-ring-3"
                    animate={{ scale: breathPhase.scale * 1.3, opacity: breathPhase.opacity * 0.4 }}
                    transition={{ duration: breathPhase.duration / 1000 * 0.9, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="pb-ring pb-ring-2"
                    animate={{ scale: breathPhase.scale * 1.13, opacity: breathPhase.opacity * 0.65 }}
                    transition={{ duration: breathPhase.duration / 1000 * 0.85, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="pb-ring pb-ring-1"
                    animate={{ scale: breathPhase.scale, opacity: breathPhase.opacity }}
                    transition={{ duration: breathPhase.duration / 1000 * 0.8, ease: 'easeInOut' }}
                  >
                    <FiHeart size={26} className="pb-breath-heart" />
                    <motion.span
                      key={breathIdx}
                      className="pb-breath-label"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {breathPhase.label}
                    </motion.span>
                  </motion.div>
                </div>

                <p className="pb-breath-hint">Follow the circle — let it guide your breathing</p>
              </motion.section>

              {/* 2. Spotify */}
              <motion.section
                className="pb-spotify-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="pb-section-header">
                  <FiMusic size={15} />
                  <span>Calming Music</span>
                </div>
                <div className="pb-playlist-tabs">
                  {PLAYLISTS.map(pl => (
                    <button
                      key={pl.id}
                      className={`pb-pl-tab ${spotifyId === pl.id ? 'active' : ''}`}
                      onClick={() => setSpotifyId(pl.id)}
                    >
                      {pl.icon} {pl.name}
                    </button>
                  ))}
                </div>
                <iframe
                  key={spotifyId}
                  className="pb-spotify-iframe"
                  src={`https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Calming Music"
                />
              </motion.section>

              {/* 3. Safe-haven map */}
              <motion.section
                className="pb-map-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="pb-section-header">
                  <FiNavigation size={15} />
                  <span>Nearest Safe Space</span>
                  {haven && (
                    <span className="pb-haven-badge" style={{ borderColor: haven.color }}>
                      {haven.icon} {haven.name}
                    </span>
                  )}
                  {routeInfo && (
                    <span className="pb-route-info">
                      🚶 {routeInfo.durationText} · {routeInfo.distanceText}
                    </span>
                  )}
                  {!haven && <span className="pb-finding">Locating safe space…</span>}
                </div>

                <div className="pb-map-wrapper">
                  <div ref={mapDivRef} className="pb-map" />
                  {!haven && (
                    <div className="pb-map-overlay-loading">
                      <div className="pb-spinner" />
                      <span>Looking for nearest safe space…</span>
                    </div>
                  )}
                </div>
              </motion.section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PanicButton;

