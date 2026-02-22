import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp, FiMapPin, FiRefreshCw, FiActivity,
  FiAlertCircle, FiSun, FiMoon, FiClock,
} from 'react-icons/fi';
import Card from '../components/Card';
import { calmScoreAPI } from '../services/api';
import '../styles/pages/Analytics.css';

/* ── helpers ──────────────────────────────────────────────────── */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function groupByDay(scores, days) {
  const buckets = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const label = days <= 7
      ? DAY_LABELS[d.getDay()]
      : `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
    buckets.push({ key, label, values: [] });
  }
  scores.forEach(s => {
    const k = new Date(s.timestamp || s.createdAt).toDateString();
    const b = buckets.find(bk => bk.key === k);
    if (b) b.values.push(s.calmScore);
  });
  return buckets.map(b => ({
    label: b.label,
    value: b.values.length
      ? Math.round(b.values.reduce((a, v) => a + v, 0) / b.values.length)
      : null,
  }));
}

function aggregateTriggers(scores) {
  const counts = {};
  scores.forEach(s => {
    (s.stressors || []).forEach(t => {
      const k = typeof t === 'string' ? t : (t.name || String(t));
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  const total = Object.values(counts).reduce((a, v) => a + v, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cnt]) => ({ name, percentage: Math.round((cnt / total) * 100) }));
}

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ── component ────────────────────────────────────────────────── */
const Analytics = () => {
  const [timeRange,       setTimeRange]       = useState('week');
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [scores,          setScores]          = useState([]);
  const [stats,           setStats]           = useState(null);
  const [chartData,       setChartData]       = useState([]);
  const [triggers,        setTriggers]        = useState([]);
  const [locationName,    setLocationName]    = useState('');
  const [locationLoading, setLocationLoading] = useState(true);

  /* ── geolocation + reverse-geocode ── */
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const d = await r.json();
          setLocationName(
            d.address?.suburb || d.address?.city_district ||
            d.address?.city   || d.address?.town ||
            d.address?.county || 'Your Area'
          );
        } catch { setLocationName('Your Area'); }
        finally  { setLocationLoading(false); }
      },
      () => setLocationLoading(false),
      { timeout: 6000 }
    );
  }, []);

  /* ── fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const days = timeRange === 'week' ? 7 : 30;
      const [statsRes, historyRes] = await Promise.all([
        calmScoreAPI.getStats(days),
        calmScoreAPI.getHistory(200, 0),
      ]);
      setStats(statsRes.data);
      setScores(historyRes.data);
      setChartData(groupByDay(statsRes.data.data || [], days));
      setTriggers(aggregateTriggers(historyRes.data));
    } catch {
      setError('Could not load analytics data. Make sure the server is running.');
    } finally { setLoading(false); }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── derived ── */
  const insights = stats ? [
    { label: 'Avg Score',    value: stats.average || '—', change: `${stats.count} recording${stats.count !== 1 ? 's' : ''}`, icon: FiActivity },
    { label: 'Highest',      value: stats.max     || '—', change: timeRange === 'week' ? 'This week' : 'This month',           icon: FiSun      },
    { label: 'Lowest',       value: stats.min     || '—', change: 'Most challenging day',                                      icon: FiMoon     },
    { label: 'Consistency',  value: stats.count > 0
        ? `${Math.min(100, Math.round((stats.count / (timeRange === 'week' ? 7 : 30)) * 100))}%`
        : '—',
      change: 'Days with data',  icon: FiClock },
  ] : [];

  const validBars = chartData.filter(b => b.value !== null);
  const maxVal    = validBars.length ? Math.max(...validBars.map(b => b.value)) : 100;

  const topTrigger = triggers[0]?.name;
  const recommendations = [
    topTrigger
      ? `${topTrigger} appears in ${triggers[0].percentage}% of stressful recordings — tackle it first.`
      : 'Record more calm scores to see personalised recommendations.',
    (stats?.average || 0) < 50
      ? 'Average below 50 — try shorter outings in low-stimulation zones.'
      : 'Average above 50 — keep up the great work!',
    'Morning sessions (9–11am) tend to show better calm scores for most users.',
    'Use the Map view to find safe havens near your common stressor locations.',
  ];

  return (
    <div className="analytics-page">
      {/* Header */}
      <motion.div className="analytics-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="analytics-header-left">
          <h1>Analytics &amp; Insights</h1>
          <p className="analytics-subtitle">
            {locationLoading
              ? 'Detecting location…'
              : locationName
              ? <><FiMapPin size={13} style={{ marginRight: 4 }} />Real-time data for <strong>{locationName}</strong></>
              : 'Track your sensory wellness journey'}
          </p>
        </div>
        <button className="analytics-refresh-btn" onClick={fetchData} disabled={loading}>
          <FiRefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </motion.div>

      {error && (
        <motion.div className="analytics-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FiAlertCircle size={16} /> {error}
        </motion.div>
      )}

      {/* Time selector */}
      <motion.div className="time-selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {['week', 'month'].map(r => (
          <button key={r} className={`time-btn ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>
            {r === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </motion.div>

      {/* Empty state */}
      {!loading && !error && scores.length === 0 && (
        <motion.div className="analytics-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FiActivity size={40} />
          <h3>No recordings yet</h3>
          <p>Go to <strong>Record</strong> and log your first calm score to see analytics here.</p>
        </motion.div>
      )}

      {/* Main grid */}
      {!loading && (scores.length > 0 || stats?.count > 0) && (
        <motion.div className="analytics-grid" variants={containerVariants} initial="hidden" animate="visible">

          {/* Chart */}
          <motion.div variants={itemVariants} className="chart-section">
            <Card className="chart-card">
              <div className="card-header">
                <h2>Calm Score Trend</h2>
                <FiTrendingUp className="header-icon" size={24} />
              </div>
              <div className="chart-container">
                <div className="chart">
                  {chartData.map((bar, idx) => (
                    <div key={idx} className="bar-wrapper" title={`${bar.label}: ${bar.value ?? 'no data'}`}>
                      <motion.div
                        className={`bar${bar.value === null ? ' bar-empty' : ''}`}
                        initial={{ height: 0 }}
                        animate={{ height: bar.value !== null ? `${Math.round((bar.value / maxVal) * 100)}%` : '4px' }}
                        transition={{ delay: idx * 0.04, duration: 0.45 }}
                        whileHover={{ scale: 1.06 }}
                      >
                        {bar.value !== null && <span className="value">{bar.value}</span>}
                      </motion.div>
                      <span className="bar-label">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><div className="legend-color primary" />Calm Score (0–100)</span>
                {locationName && (
                  <span className="legend-item location-badge"><FiMapPin size={11} /> {locationName}</span>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div variants={itemVariants} className="insights-grid">
            {insights.map((ins, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="insight-card" gradient>
                  <div className="insight-icon"><ins.icon size={18} /></div>
                  <h3>{ins.label}</h3>
                  <div className="insight-value">{ins.value}</div>
                  <p className="insight-meta">{ins.change}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stressors */}
          {triggers.length > 0 && (
            <motion.div variants={itemVariants} className="triggers-section">
              <Card className="triggers-card">
                <h2>Top Stressors</h2>
                <div className="triggers-list">
                  {triggers.map((t, idx) => (
                    <motion.div key={idx} className="trigger-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                      <div className="trigger-header">
                        <span className="trigger-name">{t.name}</span>
                        <span className="trigger-percent">{t.percentage}%</span>
                      </div>
                      <div className="trigger-bar">
                        <motion.div className="trigger-fill" initial={{ width: 0 }} animate={{ width: `${t.percentage}%` }} transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Recommendations */}
          <motion.div variants={itemVariants} className="recommendations-section">
            <Card className="recommendations-card glass">
              <h2>📊 Personalised Recommendations</h2>
              <ul className="recommendations-list">
                {recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Card>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
