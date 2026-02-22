import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle, FiMapPin, FiShare2, FiXCircle,
  FiRadio, FiCheckCircle, FiRefreshCw, FiCopy,
} from 'react-icons/fi';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { disasterAPI } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import '../styles/pages/DisasterMode.css';

const DisasterMode = () => {
  const { user } = useAuthContext();
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });
  const [isActive, setIsActive]         = useState(false);
  const [sessionId, setSessionId]       = useState(null);
  const [coords, setCoords]             = useState(null);
  const [address, setAddress]           = useState('');
  const [region, setRegion]             = useState('');
  const [broadcasts, setBroadcasts]     = useState([]);
  const [lastPing, setLastPing]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [copied, setCopied]             = useState(false);
  const [geoError, setGeoError]         = useState(null);
  const [activating, setActivating]     = useState(false);
  const watchRef   = useRef(null);
  const pingRef    = useRef(null);
  const broadRef   = useRef(null);

  const trackUrl = sessionId
    ? `${window.location.origin}/disaster/track/${sessionId}`
    : null;

  /* ── Reverse geocode ─────────────────────────────────── */
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await r.json();
      const addr  = d.display_name?.split(',').slice(0, 3).join(', ') || '';
      const rgn   = d.address?.state_district || d.address?.state || d.address?.county || '';
      setAddress(addr);
      if (!region) setRegion(rgn);
      return { addr, rgn };
    } catch { return { addr: '', rgn: '' }; }
  }, [region]);

  /* ── Load existing session on mount ─────────────────── */
  useEffect(() => {
    disasterAPI.getSession().then(({ data }) => {
      if (data.session) {
        setIsActive(true);
        setSessionId(data.session.sessionId);
        setCoords({ lat: data.session.latitude, lng: data.session.longitude });
        setAddress(data.session.address);
        setRegion(data.session.region);
      }
    }).catch(() => {});
  }, []);

  /* ── Poll broadcasts ─────────────────────────────────── */
  useEffect(() => {
    const fetchBroadcasts = () => {
      disasterAPI.getBroadcasts().then(({ data }) => {
        setBroadcasts(data.broadcasts || []);
      }).catch(() => {});
    };
    fetchBroadcasts();
    broadRef.current = setInterval(fetchBroadcasts, 15000);
    return () => clearInterval(broadRef.current);
  }, []);

  /* ── Location ping when active ───────────────────────── */
  useEffect(() => {
    if (!isActive) return;
    const doPing = (lat, lng, addr, rgn) => {
      disasterAPI.updateLocation({ latitude: lat, longitude: lng, address: addr, region: rgn })
        .then(() => setLastPing(new Date()))
        .catch(() => {});
    };

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Ensure valid coordinates
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates received from geolocation');
            return;
          }
          
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
          const { addr, rgn } = await reverseGeocode(lat, lng);
          doPing(lat, lng, addr, rgn || region);
        } catch (err) {
          console.error('Error in watch position:', err);
        }
      },
      (err) => {
        const errorMsg = err.code === 1 ? 'Location permission denied' : 
                         err.code === 2 ? 'Location unavailable' :
                         err.code === 3 ? 'Location request timeout' :
                         'Unknown location error';
        setGeoError(errorMsg);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    pingRef.current = setInterval(() => {
      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        doPing(coords.lat, coords.lng, address, region);
      }
    }, 20000);

    return () => {
      navigator.geolocation.clearWatch(watchRef.current);
      clearInterval(pingRef.current);
    };
  }, [isActive]); // eslint-disable-line

  /* ── Activate ────────────────────────────────────────── */
  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    setGeoError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      setActivating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Ensure coords are valid numbers
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid location coordinates');
          }
          
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
          const { addr, rgn } = await reverseGeocode(lat, lng);
          
          const { data } = await disasterAPI.activate({
            latitude: lat, 
            longitude: lng,
            address: addr, 
            region: rgn,
          });
          
          setSessionId(data.sessionId);
          setIsActive(true);
        } catch (e) {
          setError(e?.response?.data?.error || e.message || 'Failed to activate');
          setActivating(false);
        }
      },
      (e) => {
        const errorMsg = e.code === 1 ? 'Location permission denied' : 
                         e.code === 2 ? 'Location unavailable' :
                         e.code === 3 ? 'Location request timeout' :
                         'Unknown location error';
        setGeoError(errorMsg);
        setError(`Location access denied: ${errorMsg}. Please enable location permissions.`);
        setActivating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  /* ── Deactivate ──────────────────────────────────────── */
  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await disasterAPI.deactivate();
      setIsActive(false);
      setSessionId(null);
      setCoords(null);
      navigator.geolocation.clearWatch(watchRef.current);
      clearInterval(pingRef.current);
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Copy URL ─────────────────────────────────────────── */
  const copyUrl = () => {
    navigator.clipboard.writeText(trackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="dm-page">
      {/* ── Header ───────────────────────────────────────── */}
      <motion.div
        className="dm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`dm-header-icon ${isActive ? 'pulsing' : ''}`}>
          <FiAlertTriangle size={28} />
        </div>
        <div>
          <h1>Disaster Mode</h1>
          <p>Share your live location with rescue teams instantly</p>
        </div>
        <div className={`dm-status-pill ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? '🔴 LIVE' : '⚫ OFFLINE'}
        </div>
      </motion.div>

      <div className="dm-layout">
        {/* ── Left panel ─────────────────────────────────── */}
        <div className="dm-left">
          {/* Activate / Deactivate */}
          <motion.div className="dm-card dm-activate-card" layout>
            {!isActive ? (
              <>
                <div className="dm-warning-banner">
                  <FiAlertTriangle />
                  <span>
                    Only activate during a genuine emergency. Your GPS location
                    will be continuously shared with rescue teams.
                  </span>
                </div>

                <div className="dm-region-row">
                  <label className="dm-label">Disaster Region (optional)</label>
                  <input
                    className="dm-input"
                    placeholder="e.g. Kerala, Chennai District…"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="dm-error">
                    <FiAlertTriangle /> {error}
                  </div>
                )}

                <motion.button
                  className="dm-btn activate"
                  onClick={handleActivate}
                  disabled={activating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activating ? (
                    <><FiRefreshCw className="spin" /> Getting Location…</>
                  ) : (
                    <><FiAlertTriangle /> ACTIVATE DISASTER MODE</>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                <div className="dm-live-status">
                  <FiCheckCircle className="dm-live-icon" />
                  <div>
                    <strong>Disaster Mode ACTIVE</strong>
                    <span>Your location is being shared with rescue teams</span>
                  </div>
                </div>

                {/* Shareable URL */}
                <div className="dm-url-block">
                  <label className="dm-label"><FiShare2 /> Your Live Tracking URL</label>
                  <div className="dm-url-row">
                    <span className="dm-url-text">{trackUrl}</span>
                    <button className="dm-copy-btn" onClick={copyUrl}>
                      {copied ? <FiCheckCircle /> : <FiCopy />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="dm-url-hint">
                    Share this URL with anyone — it shows your live location without requiring login.
                  </p>
                </div>

                {/* Location info */}
                {coords && (
                  <div className="dm-coords">
                    <FiMapPin />
                    <div>
                      <span className="dm-addr">{address || 'Locating…'}</span>
                      <span className="dm-latlon">
                        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        {lastPing && ` · Last ping: ${lastPing.toLocaleTimeString()}`}
                      </span>
                    </div>
                  </div>
                )}

                {geoError && (
                  <div className="dm-error"><FiAlertTriangle /> {geoError}</div>
                )}

                <button
                  className="dm-btn deactivate"
                  onClick={handleDeactivate}
                  disabled={loading}
                >
                  {loading ? <><FiRefreshCw className="spin" /> Stopping…</> : <><FiXCircle /> Deactivate</>}
                </button>
              </>
            )}
          </motion.div>

          {/* Map */}
          <AnimatePresence>
            {isActive && coords && (typeof coords.lat === 'number' && typeof coords.lng === 'number') && (
              <motion.div
                className="dm-card dm-map-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h3><FiMapPin /> Your Live Location</h3>
                <div className="dm-map-wrap">
                  {mapsLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ height: '100%', width: '100%' }}
                      center={{ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }}
                      zoom={15}
                      options={{ streetViewControl: false, mapTypeControl: false }}
                    >
                      <Marker
                        position={{ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }}
                        title="Your Location"
                        icon={{
                          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                              <path d="M16 0C7.16 0 0 7.16 0 16c0 10 16 24 16 24s16-14 16-24c0-8.84-7.16-16-16-16z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
                              <circle cx="16" cy="16" r="6" fill="#fff"/>
                              <circle cx="16" cy="16" r="3" fill="#ef4444"/>
                            </svg>`
                          )}`,
                          scaledSize: new window.google.maps.Size(32, 40),
                          anchor: new window.google.maps.Point(16, 40),
                        }}
                      />
                    </GoogleMap>
                  ) : (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#888' }}>Loading map…</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel: broadcasts ───────────────────── */}
        <div className="dm-right">
          <div className="dm-card dm-broadcasts-card">
            <h3><FiRadio /> Emergency Broadcasts</h3>
            <p className="dm-broad-sub">Messages from disaster response teams will appear here</p>

            {broadcasts.length === 0 ? (
              <div className="dm-broad-empty">
                <FiRadio size={32} />
                <span>No broadcasts yet</span>
              </div>
            ) : (
              <div className="dm-broad-list">
                {broadcasts.map((b) => (
                  <motion.div
                    key={b._id}
                    className="dm-broad-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="dm-broad-top">
                      <span className="dm-broad-badge">
                        {b.region ? `📍 ${b.region}` : '🌐 All Regions'}
                      </span>
                      <span className="dm-broad-time">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="dm-broad-msg">{b.message}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Help info */}
          <div className="dm-card dm-help-card">
            <h4>🚨 Emergency Contacts</h4>
            <ul className="dm-help-list">
              <li><strong>National Disaster Helpline:</strong> 108</li>
              <li><strong>Police:</strong> 100</li>
              <li><strong>Ambulance:</strong> 102</li>
              <li><strong>Fire:</strong> 101</li>
              <li><strong>NDRF:</strong> 011-24363260</li>
            </ul>
            <p className="dm-help-note">
              Visit <strong>/helpdesk</strong> (restricted) to access the rescue team portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterMode;
