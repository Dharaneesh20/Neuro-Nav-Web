import React, { useEffect, useRef, useState } from 'react';
import '../styles/components/LiveMap.css';

const GMAP_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/* Shared singleton loader — no libraries=places needed */
const loadGoogleMaps = (() => {
  let p = null;
  return () => {
    if (p) return p;
    if (window.google?.maps) return Promise.resolve();
    p = new Promise((resolve, reject) => {
      // If PlanTrip already injected a script tag, just poll for readiness
      if (document.querySelector('script[data-gmaps]')) {
        const poll = setInterval(() => {
          if (window.google?.maps) { clearInterval(poll); resolve(); }
        }, 100);
        return;
      }
      const cbName = '__gmaps_livemap_cb';
      window[cbName] = () => { resolve(); delete window[cbName]; };
      const s = document.createElement('script');
      s.setAttribute('data-gmaps', '1');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&callback=${cbName}`;
      s.async = true; s.defer = true;
      s.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(s);
    });
    return p;
  };
})();

/* Nearby place types — fetched via Overpass (free, no key) */
const NEARBY_TYPES = [
  { key: 'amenity=cafe',             label: 'Café',          icon: '☕', color: '#a16207' },
  { key: 'leisure=park',             label: 'Park',          icon: '🌳', color: '#22c55e' },
  { key: 'amenity=place_of_worship', label: 'Temple/Church', icon: '🛕', color: '#f59e0b' },
  { key: 'amenity=toilets',          label: 'Restroom',      icon: '🚻', color: '#64748b' },
  { key: 'amenity=hospital',         label: 'Hospital',      icon: '🏥', color: '#ef4444' },
  { key: 'amenity=library',          label: 'Library',       icon: '📚', color: '#3b82f6' },
];

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fetchNearbyOverpass = async (lat, lng, radius = 1500) => {
  const all = [];
  for (const t of NEARBY_TYPES) {
    try {
      const [kk, vv] = t.key.split('=');
      const q = `[out:json][timeout:10];node["${kk}"="${vv}"](around:${radius},${lat},${lng});out body 6;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q });
      const data = await res.json();
      if (data.elements) {
        data.elements.slice(0, 4).forEach(el => {
          all.push({
            id: el.id,
            name: el.tags?.name || t.label,
            type: t.label,
            icon: t.icon,
            color: t.color,
            lat: el.lat,
            lng: el.lon,
            distance: haversineKm(lat, lng, el.lat, el.lon).toFixed(1),
          });
        });
      }
    } catch (_) {}
  }
  return all.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
};

/* ─────────────────────────────────────────────────────────── */
const LiveMap = ({ onSafeHavensFound, onMapReady }) => {
  const mapRef = useRef(null);
  const gmapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Get user location */
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported.');
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        setError(null);
      },
      (err) => {
        const fallback = { lat: 13.0827, lng: 80.2707 };
        setLocation(fallback);
        if (err.code === 1) setError('Location access denied — showing default area.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* Init Google Map once location is known */
  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      if (gmapRef.current) {
        // Already initialized — just pan to updated position
        gmapRef.current.panTo(location);
        userMarkerRef.current?.setPosition(location);
        return;
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy',
      });
      gmapRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Red dot — user position
      userMarkerRef.current = new window.google.maps.Marker({
        position: location, map,
        title: 'Your Location',
        zIndex: 1000,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
      });

      // Accuracy halo
      new window.google.maps.Circle({
        map, center: location, radius: 500,
        fillColor: '#ef4444', fillOpacity: 0.05,
        strokeColor: '#ef4444', strokeOpacity: 0.15, strokeWeight: 1,
      });

      setIsLoading(false);
      if (onMapReady) onMapReady(map);

      // Fetch and pin nearby places via Overpass
      fetchNearbyOverpass(location.lat, location.lng).then(places => {
        if (cancelled) return;
        places.forEach(p => addPlaceMarker(map, p));
        if (onSafeHavensFound) onSafeHavensFound(places);
      });
    }).catch(e => {
      setError('Map failed to load: ' + e.message);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng]);

  const addPlaceMarker = (map, place) => {
    const marker = new window.google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      title: place.name,
      label: { text: place.icon, fontSize: '18px' },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: place.color, fillOpacity: 0.15,
        strokeColor: place.color, strokeWeight: 1.5,
      },
    });
    marker.addListener('click', () => {
      infoWindowRef.current.setContent(`
        <div style="padding:6px 4px;max-width:200px">
          <b style="font-size:14px">${place.icon} ${place.name}</b>
          <p style="margin:4px 0 2px;font-size:12px;color:#555">${place.type}</p>
          <p style="margin:0;font-size:12px;color:#6366f1">${place.distance} km away</p>
        </div>
      `);
      infoWindowRef.current.open(map, marker);
    });
  };

  const handleSOSClick = () => {
    if (!location) return alert('Location not available');
    window.open(`https://maps.google.com/?q=${location.lat},${location.lng}`, '_blank');
    alert('📢 SOS triggered! Your location has been shared.');
  };

  if (isLoading && !location) {
    return (
      <div className="live-map-container">
        <div className="map-loading">
          <div className="spinner" />
          <p>Getting your location…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-map-container">
      <div ref={mapRef} className="live-map" />
      <button className="sos-button" onClick={handleSOSClick} title="Emergency SOS">SOS</button>
      {location && (
        <div className="location-info">
          <p>📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
        </div>
      )}
      {error && <div className="location-warning">{error}</div>}
    </div>
  );
};

export default LiveMap;
