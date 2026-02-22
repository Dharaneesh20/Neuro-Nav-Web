import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { FiMapPin, FiRefreshCw, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { disasterAPI } from '../services/api';
import '../styles/pages/DisasterTrack.css';

const DisasterTrack = () => {
  const { sessionId } = useParams();
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });
  const [data, setData]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);
  const pollRef = useRef(null);

  const fetchTrack = async () => {
    try {
      const res = await disasterAPI.track(sessionId);
      setData(res.data);
      setUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Unable to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrack();
    pollRef.current = setInterval(fetchTrack, 12000);
    return () => clearInterval(pollRef.current);
  }, [sessionId]); // eslint-disable-line

  const timeSince = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)   return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 640,
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ef4444', animation: loading ? undefined : 'pulse 2s infinite',
        }}>
          <FiAlertTriangle size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' }}>
            Live Disaster Tracking
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.50)' }}>
            NeuroNav Emergency System · Updates every 12s
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={fetchTrack}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '0.45rem 0.8rem', color: '#f1f5f9',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
            }}
          >
            <FiRefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1rem', marginTop: '3rem' }}>
          <FiRefreshCw className="spin" style={{ marginRight: 8 }} />
          Loading tracking data…
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)',
          borderRadius: 12, padding: '1rem 1.5rem', color: '#fca5a5',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          maxWidth: 640, width: '100%',
        }}>
          <FiAlertTriangle /> {error}
        </div>
      )}

      {data && (
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${data.isActive ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 18, padding: '1.25rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '1rem',
                }}>
                  {(data.userName || '?')[0].toUpperCase()}
                </div>
                <div>
                  <strong style={{ color: '#f1f5f9', display: 'block' }}>{data.userName}</strong>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                    {data.region || 'Unknown region'}
                  </span>
                </div>
              </div>
              <span style={{
                background: data.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(100,100,100,0.15)',
                border: `1px solid ${data.isActive ? '#ef4444' : '#6b7280'}`,
                color: data.isActive ? '#ef4444' : '#9ca3af',
                borderRadius: 999, padding: '0.3rem 0.8rem',
                fontSize: '0.78rem', fontWeight: 700,
              }}>
                {data.isActive ? '🔴 LIVE' : '⚫ INACTIVE'}
              </span>
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.06)', borderRadius: 10,
              padding: '0.75rem 1rem', marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f1f5f9' }}>
                <FiMapPin style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span style={{ display: 'block', fontSize: '0.92rem' }}>
                    {data.address || 'Address unavailable'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.78rem' }}>
                    {data.latitude?.toFixed(6)}, {data.longitude?.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.50)' }}>
              <span><FiActivity style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Last ping: {timeSince(data.lastPing)}
              </span>
              {updated && (
                <span>Page updated: {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              )}
            </div>
          </div>

          {/* Map */}
          {data.latitude && typeof data.latitude === 'number' && typeof data.longitude === 'number' && (
            <div style={{ height: 380, borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.25)' }}>
              {mapsLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ height: '100%', width: '100%' }}
                  center={{ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) }}
                  zoom={15}
                  options={{ streetViewControl: false, mapTypeControl: false }}
                >
                  <Marker
                    position={{ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) }}
                    title="Disaster Location"
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
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:380,background:'#1e1b4b',color:'#888' }}>Loading map…</div>
              )}
            </div>
          )}

          {/* Google Maps link */}
          {data.latitude && (
            <a
              href={`https://www.google.com/maps?q=${parseFloat(data.latitude)},${parseFloat(data.longitude)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: 12, padding: '0.85rem', color: '#a5b4fc',
                textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              <FiMapPin /> Open in Google Maps →
            </a>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        .spin { animation: spin 0.8s linear infinite; display:inline-block; }
      `}</style>
    </div>
  );
};

export default DisasterTrack;
