import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiNavigation, FiLoader, FiAlertCircle,
  FiSend, FiUser, FiCpu, FiCrosshair, FiX, FiSearch,
} from 'react-icons/fi';
import { geminiAPI } from '../services/gemini';
import '../styles/pages/PlanTrip.css';

const GMAP_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/* ── Load Google Maps script once ─────────────────────────── */
const loadGoogleMaps = (() => {
  let p = null;
  return () => {
    if (p) return p;
    if (window.google?.maps) return Promise.resolve();
    p = new Promise((resolve, reject) => {
      const id = '__gmaps_cb';
      window[id] = () => { resolve(); delete window[id]; };
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&callback=${id}`;
      s.async = true; s.defer = true;
      s.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(s);
    });
    return p;
  };
})();

/* ── Nominatim search (OpenStreetMap, free, no key needed) ───── */
const searchPlaces = async (query) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    return data.map(item => ({
      id: item.place_id,
      label: item.display_name,
      short: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    console.error('Nominatim error:', e);
    return [];
  }
};

/* ── OSRM routing (free, no key needed) ──────────────────────── */
const getRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes[0]) {
      return {
        geometry: data.routes[0].geometry,
        distance: (data.routes[0].distance / 1000).toFixed(1),
        duration: Math.round(data.routes[0].duration / 60),
      };
    }
    return null;
  } catch (e) {
    console.error('OSRM error:', e);
    return null;
  }
};

/* ── Overpass API POI search (OpenStreetMap, free) ───────────── */
const POI_QUERIES = [
  { key: 'leisure=park', label: 'Park', icon: '🌳', color: '#22c55e' },
  { key: 'amenity=place_of_worship', label: 'Temple/Church', icon: '🛕', color: '#f59e0b' },
  { key: 'amenity=cafe', label: 'Café', icon: '☕', color: '#a16207' },
  { key: 'amenity=library', label: 'Library', icon: '📚', color: '#3b82f6' },
  { key: 'amenity=toilets', label: 'Restroom', icon: '🚻', color: '#64748b' },
  { key: 'amenity=hospital', label: 'Hospital', icon: '🏥', color: '#ef4444' },
];

/* ── Haversine distance (meters) between two lat/lng points ── */
const haversineM = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* Minimum distance from a point to the route polyline (meters) */
const distToRoute = (lat, lng, routeCoords /* [[lng,lat],...] */) => {
  let min = Infinity;
  for (const [rlng, rlat] of routeCoords) {
    const d = haversineM(lat, lng, rlat, rlng);
    if (d < min) min = d;
  }
  return min;
};

/* Fetch POIs within the route bounding box using Overpass */
const fetchPOIs = async (routeCoords /* [[lng,lat],...] */) => {
  const lats = routeCoords.map(([, lat]) => lat);
  const lngs = routeCoords.map(([lng]) => lng);
  const s = Math.min(...lats), n = Math.max(...lats);
  const w = Math.min(...lngs), e = Math.max(...lngs);
  // Add ~500 m padding so nearby features on either side are caught
  const pad = 0.005;
  const bbox = `${s - pad},${w - pad},${n + pad},${e + pad}`;

  const allPOIs = [];
  for (const poi of POI_QUERIES) {
    try {
      const [kk, vv] = poi.key.split('=');
      const query = `[out:json][timeout:15];node["${kk}"="${vv}"](${bbox});out body 30;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      if (data.elements) {
        data.elements.forEach(el => {
          allPOIs.push({
            id: el.id,
            name: el.tags?.name || poi.label,
            type: poi.label,
            icon: poi.icon,
            color: poi.color,
            lat: el.lat,
            lng: el.lon,
          });
        });
      }
    } catch (_) {}
  }
  return allPOIs;
};

/* ── Gemini system prompt ────────────────────────────────────── */
const SYSTEM_PROMPT = `You are NeuroNav's AI route guide for autistic individuals and people with sensory sensitivities.

STRICT RULES:
- DO NOT start with greetings like "Hello", "Hi", "I understand", "Sure", "Of course" or any filler opener.
- Go DIRECTLY to the answer.
- Use Markdown formatting: **bold**, ## headings, bullet lists, numbered steps.
- Keep language calm, clear, and concise.

Always include:
1. ## Recommended Route — quietest, least-crowded path with step-by-step directions
2. ## Safe Havens — parks, libraries, quiet cafés along the way
3. ## Best Time to Travel — when traffic/noise is lowest
4. ## Sensory Warnings — busy or noisy spots to be aware of
5. ## Travel Tips — practical comfort advice for this specific journey`;

/* ── Lightweight Markdown renderer (no extra deps) ─────────── */
const MdRenderer = ({ text }) => {
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      elements.push(<ul key={elements.length}>{listBuffer.map((li, i) => <li key={i}>{parseLine(li)}</li>)}</ul>);
      listBuffer = [];
    }
  };

  const parseLine = (raw) =>
    raw
      .replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`)
      .replace(/\*(.+?)\*/g, (_, m) => `<em>${m}</em>`)
      .replace(/`(.+?)`/g, (_, m) => `<code>${m}</code>`);

  const renderInline = (raw) => <span dangerouslySetInnerHTML={{ __html: parseLine(raw) }} />;

  lines.forEach((line, i) => {
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    const bullet = line.match(/^[-*]\s+(.+)/);
    const numered = line.match(/^\d+\.\s+(.+)/);
    const hr = line.match(/^---+$/);

    if (h3) { flushList(); elements.push(<h4 key={i}>{renderInline(h3[1])}</h4>); }
    else if (h2) { flushList(); elements.push(<h3 key={i}>{renderInline(h2[1])}</h3>); }
    else if (h1) { flushList(); elements.push(<h2 key={i}>{renderInline(h1[1])}</h2>); }
    else if (bullet) { listBuffer.push(bullet[1]); }
    else if (numered) { listBuffer.push(numered[1]); }
    else if (hr) { flushList(); elements.push(<hr key={i} />); }
    else if (line.trim() === '') { flushList(); }
    else { flushList(); elements.push(<p key={i}>{renderInline(line)}</p>); }
  });
  flushList();
  return <div className="pt-md">{elements}</div>;
};

/* ══════════════════════════════════════════════════════════════ */
const PlanTrip = () => {
  const mapRef = useRef(null);
  const gmapRef = useRef(null);       // google.maps.Map instance
  const gmRouteRef = useRef(null);    // google.maps.Polyline for route
  const gmMarkersRef = useRef([]);    // google.maps.Marker array

  /* Search state */
  const [srcText, setSrcText] = useState('');
  const [srcResults, setSrcResults] = useState([]);
  const [srcSelected, setSrcSelected] = useState(null);
  const [srcLoading, setSrcLoading] = useState(false);

  const [dstText, setDstText] = useState('');
  const [dstResults, setDstResults] = useState([]);
  const [dstSelected, setDstSelected] = useState(null);
  const [dstLoading, setDstLoading] = useState(false);

  const [locLoading, setLocLoading] = useState(false);

  /* Route */
  const [planning, setPlanning] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState('');

  /* POIs */
  const [pois, setPois] = useState([]);

  /* Chat */
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  /* Search debounce timers */
  const srcTimer = useRef(null);
  const dstTimer = useRef(null);

  /* ── Init Google Maps ─────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      if (gmapRef.current) return; // already initialized
      gmapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 13.0827, lng: 80.2707 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
      });
    }).catch(e => console.error('Google Maps load error:', e));

    return () => {
      cancelled = true;
      // Clean up markers/polyline but keep map instance (GMaps manages its own DOM)
      gmMarkersRef.current.forEach(m => m.setMap(null));
      gmMarkersRef.current = [];
      if (gmRouteRef.current) { gmRouteRef.current.setMap(null); gmRouteRef.current = null; }
    };
  }, []);

  /* Scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Debounced search ─────────────────────────────────────── */
  const handleSrcChange = (val) => {
    setSrcText(val);
    setSrcSelected(null);
    clearTimeout(srcTimer.current);
    if (val.length < 2) { setSrcResults([]); return; }
    setSrcLoading(true);
    srcTimer.current = setTimeout(async () => {
      const results = await searchPlaces(val);
      setSrcResults(results);
      setSrcLoading(false);
    }, 350);
  };

  const handleDstChange = (val) => {
    setDstText(val);
    setDstSelected(null);
    clearTimeout(dstTimer.current);
    if (val.length < 2) { setDstResults([]); return; }
    setDstLoading(true);
    dstTimer.current = setTimeout(async () => {
      const results = await searchPlaces(val);
      setDstResults(results);
      setDstLoading(false);
    }, 350);
  };

  /* ── GPS Location ─────────────────────────────────────────── */
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setRouteError('Geolocation not supported by your browser.');
      return;
    }
    setLocLoading(true);
    setRouteError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const label = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setSrcText(label);
          setSrcSelected({ label, short: label.split(',')[0], lat, lng });
        } catch {
          const label = `My Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setSrcText(label);
          setSrcSelected({ label, short: 'My Location', lat, lng });
        }
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setRouteError('Location access denied. Please type your starting point.');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  /* ── Draw route on Google Map ────────────────────────────── */
  const drawRoute = useCallback(async (startLat, startLng, endLat, endLng) => {
    const map = gmapRef.current;
    if (!map) return null;

    // Clear old route + markers
    if (gmRouteRef.current) gmRouteRef.current.setMap(null);
    gmMarkersRef.current.forEach(m => m.setMap(null));
    gmMarkersRef.current = [];

    // Get route geometry from OSRM (free, no Google Directions needed)
    const route = await getRoute(startLat, startLng, endLat, endLng);
    if (!route) return null;

    // Convert GeoJSON coords [lng, lat] → Google LatLng [{lat, lng}]
    const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

    // Draw polyline
    gmRouteRef.current = new window.google.maps.Polyline({
      path,
      strokeColor: '#6366f1',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map,
    });

    const makeSvgPin = (fill, label) => ({
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">`+
        `<path d="M18 0C8.06 0 0 8.06 0 18c0 12.42 18 28 18 28S36 30.42 36 18C36 8.06 27.94 0 18 0z" fill="${fill}" stroke="white" stroke-width="2"/>`+
        `<text x="18" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="sans-serif">${label}</text>`+
        `</svg>`
      )}`,
      scaledSize: new window.google.maps.Size(36, 46),
      anchor: new window.google.maps.Point(18, 46),
    });

    // Start marker (green pin with A)
    const startMarker = new window.google.maps.Marker({
      position: { lat: startLat, lng: startLng },
      map,
      title: 'Start',
      zIndex: 100,
      icon: makeSvgPin('#22c55e', 'A'),
    });
    // End marker (red pin with B)
    const endMarker = new window.google.maps.Marker({
      position: { lat: endLat, lng: endLng },
      map,
      title: 'Destination',
      zIndex: 100,
      icon: makeSvgPin('#ef4444', 'B'),
    });
    gmMarkersRef.current.push(startMarker, endMarker);

    // Fit bounds to route
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, 60);

    return route;
  }, []);

  /* ── Draw POI markers on Google Map ─────────────────────── */
  const drawPOIMarkers = useCallback((poiList) => {
    const map = gmapRef.current;
    if (!map) return;
    const infoWindow = new window.google.maps.InfoWindow();

    poiList.forEach(poi => {
      const marker = new window.google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map,
        title: poi.name,
        zIndex: 50,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">`+
            `<path d="M16 0C7.16 0 0 7.16 0 16c0 11.03 16 24 16 24S32 27.03 32 16C32 7.16 24.84 0 16 0z" fill="${poi.color}" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>`+
            `<text x="16" y="21" text-anchor="middle" font-size="13" font-family="sans-serif">${poi.icon}</text>`+
            `</svg>`
          )}`,
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40),
        },
      });
      marker.addListener('click', () => {
        infoWindow.setContent(`<div style="font-weight:700">${poi.icon} ${poi.name}</div><div style="font-size:12px;color:#64748b">${poi.type}</div>`);
        infoWindow.open(map, marker);
      });
      gmMarkersRef.current.push(marker);
    });
  }, []);

  /* ── Plan trip ────────────────────────────────────────────── */
  const handlePlanTrip = async () => {
    if (!srcSelected || !dstSelected) return;
    setPlanning(true);
    setRouteError('');
    setRouteReady(false);
    setPois([]);
    setMessages([]);

    try {
      // Draw route
      const route = await drawRoute(
        srcSelected.lat, srcSelected.lng,
        dstSelected.lat, dstSelected.lng
      );

      if (!route) {
        setRouteError('Could not find a route between these locations. Try different places.');
        setPlanning(false);
        return;
      }

      setRouteInfo(route);

      // Fetch POIs within route bbox, then filter to only those ≤ 400 m from the route
      const routeCoords = route.geometry.coordinates; // [[lng, lat], ...]
      const rawPOIs = await fetchPOIs(routeCoords);
      const poiList = rawPOIs.filter(poi => distToRoute(poi.lat, poi.lng, routeCoords) <= 400);
      setPois(poiList);
      if (poiList.length > 0) drawPOIMarkers(poiList);

      setRouteReady(true);

      // Auto start Gemini chat — send silently, only show AI reply
      const firstMsg = `I'm traveling from "${srcSelected.label}" to "${dstSelected.label}". Distance: ${route.distance} km, Estimated time: ${route.duration} minutes. Please suggest the safest, quietest route and list safe havens along the way for someone with sensory sensitivities.`;
      await sendInitialGemini(firstMsg);
    } catch (e) {
      console.error('Plan trip error:', e);
      setRouteError('Something went wrong. Please try again.');
    } finally {
      setPlanning(false);
    }
  };

  /* ── Gemini chat ──────────────────────────────────────────── */
  // Silent initial call — no user bubble, only AI reply shown
  const sendInitialGemini = async (text) => {
    setChatLoading(true);
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nTrip: "${srcSelected?.label}" → "${dstSelected?.label}"\n\nUser: ${text}`;
      const reply = await geminiAPI.chat(prompt);
      setMessages([{ role: 'ai', text: reply }]);
    } catch (err) {
      const errMsg = err?.message || 'Unknown error';
      setMessages([{ role: 'ai', text: `⚠️ AI error: ${errMsg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Follow-up messages — shows user bubble then AI reply
  const sendGemini = async (text) => {
    setChatLoading(true);
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nTrip: "${srcSelected?.label}" → "${dstSelected?.label}"\n\nUser: ${text}`;
      const reply = await geminiAPI.chat(prompt);
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      const errMsg = err?.message || 'Unknown error';
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ AI error: ${errMsg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    await sendGemini(text);
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  };

  const canPlan = srcSelected && dstSelected && !planning;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="pt-page">
      {/* Header */}
      <motion.div className="pt-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>🧭 Plan Your Safe Journey</h1>
        <p>Quiet, sensory-friendly routes — search any place, get AI guidance</p>
      </motion.div>

      <div className="pt-body">

        {/* ── Search Card ── */}
        <motion.div className="pt-search-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Source */}
          <div className="pt-field">
            <label>📍 Source / Start Location</label>
            <div className="pt-input-row">
              <div className="pt-input-wrap">
                <FiSearch className="pt-input-icon" size={16} />
                <input
                  type="text"
                  className="pt-input"
                  placeholder="Type your starting point (e.g. Perambur, Chennai)"
                  value={srcText}
                  onChange={e => handleSrcChange(e.target.value)}
                  autoComplete="off"
                />
                {srcLoading && <FiLoader className="pt-input-spin" size={15} />}
                {srcText && (
                  <button className="pt-clear" onClick={() => { setSrcText(''); setSrcSelected(null); setSrcResults([]); }}>
                    <FiX size={14} />
                  </button>
                )}
                {srcResults.length > 0 && (
                  <ul className="pt-dropdown">
                    {srcResults.map(r => (
                      <li key={r.id} className="pt-dd-item" onClick={() => { setSrcText(r.label); setSrcSelected(r); setSrcResults([]); }}>
                        <FiMapPin size={14} />
                        <div><strong>{r.short}</strong><small>{r.label}</small></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button className={`pt-gps-btn${locLoading ? ' loading' : ''}`} onClick={useCurrentLocation} disabled={locLoading}>
                {locLoading ? <FiLoader className="spin" size={15} /> : <FiCrosshair size={15} />}
                <span>{locLoading ? 'Getting…' : 'Current'}</span>
              </button>
            </div>
            {srcSelected && <div className="pt-badge">✓ {srcSelected.short}</div>}
          </div>

          {/* Destination */}
          <div className="pt-field">
            <label>🎯 Destination</label>
            <div className="pt-input-wrap">
              <FiSearch className="pt-input-icon" size={16} />
              <input
                type="text"
                className="pt-input"
                placeholder="Type destination (e.g. Marina Beach, Coimbatore)"
                value={dstText}
                onChange={e => handleDstChange(e.target.value)}
                autoComplete="off"
              />
              {dstLoading && <FiLoader className="pt-input-spin" size={15} />}
              {dstText && (
                <button className="pt-clear" onClick={() => { setDstText(''); setDstSelected(null); setDstResults([]); }}>
                  <FiX size={14} />
                </button>
              )}
              {dstResults.length > 0 && (
                <ul className="pt-dropdown">
                  {dstResults.map(r => (
                    <li key={r.id} className="pt-dd-item" onClick={() => { setDstText(r.label); setDstSelected(r); setDstResults([]); }}>
                      <FiMapPin size={14} />
                      <div><strong>{r.short}</strong><small>{r.label}</small></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {dstSelected && <div className="pt-badge">✓ {dstSelected.short}</div>}
          </div>

          {/* Plan Button */}
          <motion.button
            className="pt-plan-btn"
            onClick={handlePlanTrip}
            disabled={!canPlan}
            whileHover={canPlan ? { scale: 1.02 } : {}}
            whileTap={canPlan ? { scale: 0.97 } : {}}
          >
            {planning
              ? <><FiLoader className="spin" size={18} /> Finding your safe route…</>
              : <><FiNavigation size={18} /> Plan My Safe Route</>}
          </motion.button>

          {routeError && (
            <div className="pt-error"><FiAlertCircle size={16} />{routeError}</div>
          )}

          {routeInfo && (
            <div className="pt-route-stats">
              <span>🛣️ {routeInfo.distance} km</span>
              <span>⏱️ ~{routeInfo.duration} min</span>
            </div>
          )}
        </motion.div>

        {/* ── Map ── */}
        <motion.div className="pt-map-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="pt-map-legend">
            {POI_QUERIES.map(p => (
              <span key={p.key} className="pt-legend-item">{p.icon} {p.label}</span>
            ))}
          </div>
          <div ref={mapRef} className="pt-map" />
        </motion.div>

        {/* ── POI Cards ── */}
        <AnimatePresence>
          {pois.length > 0 && (
            <motion.div className="pt-poi-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2>🗺️ Safe Havens Along Your Route</h2>
              <div className="pt-poi-grid">
                {pois.map((poi, i) => (
                  <motion.div
                    key={poi.id}
                    className="pt-poi-card"
                    style={{ borderLeftColor: poi.color }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="pt-poi-icon">{poi.icon}</div>
                    <div className="pt-poi-info">
                      <strong>{poi.name}</strong>
                      <span className="pt-poi-tag" style={{ background: poi.color }}>{poi.type}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Chat ── */}
        <AnimatePresence>
          {routeReady && (
            <motion.div className="pt-chat-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="pt-chat-header">
                <FiCpu size={20} />
                <div>
                  <h3>NeuroNav AI Route Guide</h3>
                  <small>Powered by Gemini · Sensory-friendly advice</small>
                </div>
              </div>

              <div className="pt-chat-messages">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`pt-msg ${msg.role}`}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="pt-msg-avatar">
                      {msg.role === 'user' ? <FiUser size={15} /> : <FiCpu size={15} />}
                    </div>
                    <div className="pt-msg-bubble">
                      {msg.role === 'ai'
                        ? <MdRenderer text={msg.text} />
                        : <p>{msg.text}</p>}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="pt-msg ai">
                    <div className="pt-msg-avatar"><FiCpu size={15} /></div>
                    <div className="pt-msg-bubble pt-typing"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="pt-chat-input-row">
                <textarea
                  rows={2}
                  className="pt-chat-input"
                  placeholder="Ask about this route, quiet spots, safety tips…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                />
                <button className="pt-chat-send" onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}>
                  <FiSend size={17} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default PlanTrip;
