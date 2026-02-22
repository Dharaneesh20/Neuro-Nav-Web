import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShield, FiUsers, FiMapPin, FiSend, FiLogOut,
  FiFilter, FiRefreshCw, FiAlertTriangle, FiRadio,
} from 'react-icons/fi';
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { disasterAPI } from '../services/api';
import '../styles/pages/HelpDesk.css';

/* ══════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════ */
const LoginScreen = ({ onLogin }) => {
  const [user, setUser]   = useState('');
  const [pass, setPass]   = useState('');
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { data } = await disasterAPI.helpdesk.login({ username: user, password: pass });
      onLogin(data.token);
    } catch {
      setErr('Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hd-login-wrap">
      <motion.div
        className="hd-login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="hd-login-icon"><FiShield size={36} /></div>
        <h2>Rescue Operations Portal</h2>
        <p>Restricted access — authorised personnel only</p>

        <form onSubmit={handleSubmit} className="hd-login-form">
          <input
            className="hd-input"
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
          <input
            className="hd-input"
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
          {err && (
            <div className="hd-login-err"><FiAlertTriangle /> {err}</div>
          )}
          <button className="hd-btn primary full" disabled={busy}>
            {busy ? <><FiRefreshCw className="spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN HELPDESK DASHBOARD
   ══════════════════════════════════════ */
const HelpDeskDashboard = ({ token, onLogout }) => {
  const [sessions, setSessions]     = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [regions, setRegions]       = useState([]);
  const [filterRegion, setFilter]   = useState('');
  const [message, setMessage]       = useState('');
  const [msgRegion, setMsgRegion]   = useState('');
  const [selectedSession, setSelected] = useState(null);
  const [sending, setSending]       = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [mapCenter, setMapCenter]   = useState({ lat: 20.5937, lng: 78.9629 }); // India default
  const [activeMarker, setActiveMarker] = useState(null);
  const pollRef = useRef(null);
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAll = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const [sRes, bRes, rRes] = await Promise.all([
        disasterAPI.helpdesk.sessions(token, filterRegion),
        disasterAPI.helpdesk.broadcasts(token),
        disasterAPI.helpdesk.regions(token),
      ]);
      setSessions(sRes.data.sessions || []);
      setBroadcasts(bRes.data.broadcasts || []);
      setRegions(rRes.data.regions || []);

      // Center map on first active session
      const first = (sRes.data.sessions || [])[0];
      if (first?.latitude) setMapCenter({ lat: parseFloat(first.latitude), lng: parseFloat(first.longitude) });
    } catch { /* token may have expired */ }
    setLoadingSessions(false);
  }, [token, filterRegion]);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchAll]);

  const sendBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await disasterAPI.helpdesk.broadcast(token, { message: message.trim(), region: msgRegion });
      setMessage('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      fetchAll();
    } catch { /* error */ }
    setSending(false);
  };

  const timeSince = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  return (
    <div className="hd-page">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="hd-topbar">
        <div className="hd-topbar-left">
          <FiShield size={22} />
          <span>Rescue Operations Portal</span>
          <span className="hd-live-badge">🔴 LIVE</span>
        </div>
        <div className="hd-topbar-right">
          <span className="hd-session-count">
            <FiUsers /> {sessions.length} active user{sessions.length !== 1 ? 's' : ''}
          </span>
          <button className="hd-btn ghost sm" onClick={fetchAll} disabled={loadingSessions}>
            <FiRefreshCw className={loadingSessions ? 'spin' : ''} />
          </button>
          <button className="hd-btn ghost sm" onClick={onLogout}>
            <FiLogOut /> Sign Out
          </button>
        </div>
      </div>

      <div className="hd-layout">
        {/* ── Left: user list + broadcast ──────────────── */}
        <div className="hd-left">
          {/* Filter */}
          <div className="hd-filter-bar">
            <FiFilter />
            <select
              className="hd-select"
              value={filterRegion}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {filterRegion && (
              <button className="hd-btn ghost sm" onClick={() => setFilter('')}>Clear</button>
            )}
          </div>

          {/* User cards */}
          <div className="hd-sessions">
            {sessions.length === 0 ? (
              <div className="hd-empty">
                <FiUsers size={28} />
                <span>{loadingSessions ? 'Loading…' : 'No active users in disaster mode'}</span>
              </div>
            ) : (
              sessions.map((s) => (
                <motion.div
                  key={s._id}
                  className={`hd-session-card ${selectedSession?._id === s._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(s);
                    if (s.latitude) setMapCenter({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) });
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="hd-session-avatar">
                    {(s.user?.name || s.user?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="hd-session-info">
                    <strong>{s.user?.name || s.user?.username || 'Unknown'}</strong>
                    <span className="hd-session-email">{s.user?.email || ''}</span>
                    <span className="hd-session-addr">
                      <FiMapPin size={11} /> {s.address || `${s.latitude?.toFixed(4)}, ${s.longitude?.toFixed(4)}`}
                    </span>
                  </div>
                  <div className="hd-session-meta">
                    {s.region && <span className="hd-region-tag">{s.region}</span>}
                    <span className="hd-ping">{timeSince(s.lastPing)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Broadcast composer */}
          <div className="hd-broadcast-composer">
            <h4><FiRadio /> Send Broadcast Message</h4>
            <div className="hd-row-2">
              <select
                className="hd-select"
                value={msgRegion}
                onChange={(e) => setMsgRegion(e.target.value)}
              >
                <option value="">🌐 All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>📍 {r}</option>
                ))}
              </select>
            </div>
            <textarea
              className="hd-textarea"
              placeholder="Type emergency instructions, evacuation routes, or safety updates…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
            <div className="hd-broadcast-footer">
              <span className="hd-char">{message.length}/500</span>
              <AnimatePresence>
                {sendSuccess && (
                  <motion.span
                    className="hd-send-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    ✅ Broadcast sent
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                className="hd-btn primary"
                onClick={sendBroadcast}
                disabled={sending || !message.trim()}
              >
                {sending ? <FiRefreshCw className="spin" /> : <FiSend />}
                {sending ? 'Sending…' : 'Broadcast'}
              </button>
            </div>
            {/* Previous broadcasts */}
            {broadcasts.length > 0 && (
              <div className="hd-prev-broadcasts">
                <p className="hd-prev-label">Recent Broadcasts</p>
                {broadcasts.slice(0, 5).map((b) => (
                  <div key={b._id} className="hd-prev-item">
                    <span className="hd-prev-badge">{b.region || 'All'}</span>
                    <span className="hd-prev-msg">{b.message}</span>
                    <span className="hd-prev-time">
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: live map ───────────────────────────── */}
        <div className="hd-right">
          <div className="hd-map-card">
            <div className="hd-map-header">
              <h3><FiMapPin /> Live Locations Map</h3>
              {selectedSession && (
                <button className="hd-btn ghost sm" onClick={() => setSelected(null)}>
                  Clear selection
                </button>
              )}
            </div>
            <div className="hd-map-wrap">
              {mapsLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ height: '100%', width: '100%' }}
                  center={mapCenter}
                  zoom={selectedSession ? 13 : 5}
                  options={{ streetViewControl: false, mapTypeControl: false }}
                >
                  {sessions.map((s) =>
                    s.latitude ? (
                      <OverlayView
                        key={s._id}
                        position={{ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          onClick={() => setActiveMarker(activeMarker === s._id ? null : s._id)}
                          style={{ position: 'relative', cursor: 'pointer', transform: 'translate(-50%, -100%)' }}
                        >
                          {/* Pin body */}
                          <div style={{
                            width: 28, height: 28, borderRadius: '50% 50% 50% 0',
                            background: '#ef4444', border: '3px solid #fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
                            transform: 'rotate(-45deg)',
                          }} />
                          {/* Initial inside pin */}
                          <div style={{
                            position: 'absolute', top: 5, left: 5,
                            width: 18, height: 18, borderRadius: '50%',
                            background: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 800, fontSize: 9,
                            color: '#ef4444', transform: 'rotate(45deg)',
                          }}>
                            {(s.user?.name || s.user?.username || '?')[0].toUpperCase()}
                          </div>
                          {/* Info popup */}
                          {activeMarker === s._id && (
                            <div style={{
                              position: 'absolute', bottom: 38, left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#fff', borderRadius: 8, padding: '8px 12px',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                              minWidth: 180, zIndex: 999, whiteSpace: 'nowrap',
                              fontSize: 12, color: '#1e293b', lineHeight: 1.7,
                            }}>
                              <strong>{s.user?.name || s.user?.username}</strong><br />
                              📍 {s.address || `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`}<br />
                              🕒 {timeSince(s.lastPing)}<br />
                              {s.region && <span>🗺 {s.region}</span>}
                              <div style={{
                                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                                width: 12, height: 12, background: '#fff',
                                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                              }} />
                            </div>
                          )}
                        </div>
                      </OverlayView>
                    ) : null
                  )}
                </GoogleMap>
              ) : (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#888' }}>Loading map…</div>
              )}
            </div>
            {selectedSession && (
              <div className="hd-selected-info">
                <strong>{selectedSession.user?.name || selectedSession.user?.username}</strong>
                <span>{selectedSession.address}</span>
                <a
                  href={`/disaster/track/${selectedSession.sessionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hd-track-link"
                >
                  Open public tracking page →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════ */
const HelpDesk = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem('hd_token') || '');

  const handleLogin = (t) => {
    sessionStorage.setItem('hd_token', t);
    setToken(t);
  };
  const handleLogout = () => {
    sessionStorage.removeItem('hd_token');
    setToken('');
  };

  return token
    ? <HelpDeskDashboard token={token} onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />;
};

export default HelpDesk;
