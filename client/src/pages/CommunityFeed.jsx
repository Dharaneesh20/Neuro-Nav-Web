import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FiPlus, FiMapPin, FiArrowUp, FiArrowDown, FiMessageSquare,
  FiFlag, FiX, FiFilter, FiAlertTriangle, FiShield, FiNavigation,
  FiImage, FiVideo, FiLoader,
  FiRefreshCw, FiAlertCircle, FiUser,
} from 'react-icons/fi';
import { communityReportAPI } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import '../styles/pages/CommunityFeed.css';

/* ── fix default leaflet icon ─────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

/* ── constants ────────────────────────────────────────────────── */
const RULES = [
  { icon: '📍', text: 'Always tag a real location with every post.' },
  { icon: '🤝', text: 'Be respectful — no harassment or personal attacks.' },
  { icon: '🚫', text: 'NSFW content is strictly prohibited. Posts & accounts get banned.' },
  { icon: '🔇', text: 'No spam, self-promotion, or duplicate reports.' },
  { icon: '📸', text: 'Only post media relevant to the sensory/safety issue.' },
  { icon: '⚠️', text: 'Bans: 4 days → 2 weeks → 1 month → Permanent.' },
];

const REPORT_TYPES = [
  { value: 'sound-area',       label: '🔊 Sound / Noise Area' },
  { value: 'sensory-trigger',  label: '⚡ Sensory Trigger Zone' },
  { value: 'unsafe-zone',      label: '⚠️ Unsafe Zone' },
  { value: 'positive-space',   label: '✅ Positive / Calm Space' },
];

const SEVERITIES = ['mild', 'moderate', 'severe'];

const BAN_OPTIONS = [
  { value: '4d',        label: '4 Days' },
  { value: '2w',        label: '2 Weeks' },
  { value: '1m',        label: '1 Month' },
  { value: 'permanent', label: '☠️ Permanent' },
];

/* ── helpers ──────────────────────────────────────────────────── */
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)        return `${s}s ago`;
  if (s < 3600)      return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)     return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ── sub-component: tiny map on a post ───────────────────────── */
const PostMiniMap = ({ lat, lng }) => {
  if (!lat || !lng || (lat === 0 && lng === 0)) return null;
  return (
    <div className="post-mini-map">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
};

/* ── sub-component: map picker inside Create modal ───────────── */
const LocationPicker = ({ onPick }) => {
  const MapClickHandler = () => {
    useMapEvents({ click(e) { onPick(e.latlng); } });
    return null;
  };
  return (
    <MapContainer
      center={[13.08, 80.27]}
      zoom={10}
      style={{ height: 220, width: '100%', borderRadius: 12, cursor: 'crosshair' }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />
    </MapContainer>
  );
};

/* ── sub-component: single post card ─────────────────────────── */
const PostCard = ({ post, currentUserId, onVote, onFlag, onBan, onCommentOpen }) => {
  const coords = post.location?.coordinates;
  const [lng, lat] = coords || [0, 0];
  const isFlagged  = post.flaggedBy?.includes(currentUserId);
  const myVote     = post.userVotes?.find(v => v.userId === currentUserId)?.voteType;

  const severityColor = {
    mild:     'var(--cf-mild)',
    moderate: 'var(--cf-moderate)',
    severe:   'var(--cf-severe)',
  }[post.severity || 'moderate'];

  return (
    <motion.article
      className="cf-post"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Author row */}
      <div className="cf-post-author">
        <div className="cf-avatar">
          {post.authorAvatar
            ? <img src={post.authorAvatar} alt={post.authorName} />
            : <FiUser size={16} />}
        </div>
        <div className="cf-author-info">
          <span className="cf-author-name">{post.authorName || 'Anonymous'}</span>
          <span className="cf-post-meta">
            <FiMapPin size={11} />
            {post.location?.address || post.district || 'Unknown location'}
            &nbsp;·&nbsp;{timeAgo(post.createdAt)}
          </span>
        </div>
        <span className="cf-type-badge" data-type={post.reportType}>
          {REPORT_TYPES.find(t => t.value === post.reportType)?.label || post.reportType}
        </span>
        {post.severity && (
          <span className="cf-severity-dot" style={{ background: severityColor }} title={post.severity} />
        )}
      </div>

      {/* Title & description */}
      <h3 className="cf-post-title">{post.title}</h3>
      {post.description && <p className="cf-post-desc">{post.description}</p>}

      {/* Media */}
      {(post.media?.length > 0 || post.image) && (
        <div className="cf-media-row">
          {(post.media?.length > 0 ? post.media : [{ url: post.image, mediaType: 'image' }])
            .map((m, i) =>
              m.mediaType === 'video'
                ? <video key={i} src={m.url} controls className="cf-media-item" />
                : <img   key={i} src={m.url} alt="post media" className="cf-media-item" />
            )}
        </div>
      )}

      {/* Mini map */}
      <PostMiniMap lat={lat} lng={lng} />

      {/* Actions */}
      <div className="cf-actions">
        <button
          className={`cf-vote-btn up${myVote === 'upvote' ? ' active' : ''}`}
          onClick={() => onVote(post._id, 'upvote')}
        >
          <FiArrowUp size={14} /> {post.upvotes}
        </button>
        <button
          className={`cf-vote-btn down${myVote === 'downvote' ? ' active' : ''}`}
          onClick={() => onVote(post._id, 'downvote')}
        >
          <FiArrowDown size={14} /> {post.downvotes}
        </button>

        <button className="cf-action-btn" onClick={() => onCommentOpen(post)}>
          <FiMessageSquare size={14} /> {post.comments?.length || 0} Comments
        </button>

        <button
          className={`cf-action-btn flag${isFlagged ? ' flagged' : ''}`}
          onClick={() => onFlag(post._id)}
          title={isFlagged ? 'Already flagged' : 'Flag as inappropriate / NSFW'}
        >
          <FiFlag size={14} />
          {post.flagCount > 0 && <span className="cf-flag-count">{post.flagCount}</span>}
        </button>

        {/* Ban option (always visible so any user can escalate — real apps would be role-gated) */}
        <button
          className="cf-action-btn ban"
          onClick={() => onBan(post)}
          title="Report & ban author"
        >
          <FiShield size={14} /> Report
        </button>
      </div>
    </motion.article>
  );
};

/* ── sub-component: comments panel/drawer ────────────────────── */
const CommentsPanel = ({ post, currentUser, onClose, onAddComment }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onAddComment(post._id, text);
    setText('');
    setLoading(false);
  };

  return (
    <motion.div
      className="cf-comments-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cf-comments-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="cf-comments-header">
          <h3>Comments ({post.comments?.length || 0})</h3>
          <button className="cf-icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="cf-comments-body">
          {(post.comments || []).length === 0
            ? <p className="cf-empty-comments">No comments yet. Be the first!</p>
            : (post.comments || []).map((c, i) => (
                <div key={i} className="cf-comment">
                  <div className="cf-avatar sm">
                    {c.authorAvatar
                      ? <img src={c.authorAvatar} alt={c.authorName} />
                      : <FiUser size={12} />}
                  </div>
                  <div className="cf-comment-body">
                    <span className="cf-comment-author">{c.authorName || 'Anonymous'}</span>
                    <span className="cf-comment-time">{timeAgo(c.createdAt)}</span>
                    <p className="cf-comment-text">{c.text}</p>
                  </div>
                </div>
              ))
          }
        </div>

        <div className="cf-comment-input-row">
          <div className="cf-avatar sm">
            {currentUser?.profilePicture || currentUser?.googleAvatar
              ? <img src={currentUser.profilePicture || currentUser.googleAvatar} alt="me" />
              : <FiUser size={12} />}
          </div>
          <textarea
            className="cf-comment-textarea"
            placeholder="Add a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
          />
          <button className="cf-submit-btn sm" onClick={submit} disabled={loading || !text.trim()}>
            {loading ? <FiLoader size={14} className="spin" /> : 'Post'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── sub-component: ban modal ────────────────────────────────── */
const BanModal = ({ post, onClose, onBan }) => {
  const [duration, setDuration] = useState('4d');
  const [reason,   setReason]   = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setLoading(true);
    await onBan(post._id, duration, reason);
    setLoading(false);
    onClose();
  };

  return (
    <motion.div className="cf-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="cf-modal sm"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="cf-modal-header">
          <h3><FiAlertTriangle /> Report &amp; Ban Author</h3>
          <button className="cf-icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="cf-modal-body">
          <p className="cf-ban-target">Reporting post by <strong>{post.authorName || 'Anonymous'}</strong></p>
          <label className="cf-label">Ban Duration</label>
          <div className="cf-ban-options">
            {BAN_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`cf-ban-opt${duration === o.value ? ' active' : ''}`}
                onClick={() => setDuration(o.value)}
              >{o.label}</button>
            ))}
          </div>
          <label className="cf-label">Reason (optional)</label>
          <textarea
            className="cf-textarea"
            rows={3}
            placeholder="Describe the violation…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="cf-ban-rules">
            <FiShield size={13} />
            Banning auto-hides the post and suspends the account per community rules.
          </div>
        </div>
        <div className="cf-modal-footer">
          <button className="cf-btn ghost" onClick={onClose}>Cancel</button>
          <button className="cf-btn danger" onClick={submit} disabled={loading}>
            {loading ? 'Submitting…' : 'Ban Author'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── sub-component: create post modal ───────────────────────── */
const CreatePostModal = ({ currentUser, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', reportType: 'sensory-trigger', severity: 'moderate',
  });
  const [media,       setMedia]       = useState([]); // [{url, mediaType}]
  const [locMode,     setLocMode]     = useState('current'); // 'current' | 'custom'
  const [pickedCoord, setPickedCoord] = useState(null);
  const [address,     setAddress]     = useState('');
  const [district,    setDistrict]    = useState('');
  const [currentCoord, setCurrentCoord] = useState(null);
  const [locError,    setLocError]    = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef();

  // get current location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        setCurrentCoord([coords.longitude, coords.latitude]);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
          const d = await r.json();
          setAddress(
            [d.address?.suburb, d.address?.city || d.address?.town, d.address?.county]
              .filter(Boolean).join(', ')
          );
          setDistrict(d.address?.city || d.address?.town || d.address?.county || '');
        } catch {}
      },
      () => setLocError('Could not get your location. Use the map picker instead.'),
      { timeout: 8000 }
    );
  }, []);

  const handleFile = async e => {
    const files = Array.from(e.target.files).slice(0, 4);
    setUploading(true);
    const result = [];
    for (const f of files) {
      if (f.size > 20 * 1024 * 1024) { setError('File too large (max 20 MB each)'); continue; }
      const url = await readFileAsDataURL(f);
      result.push({ url, mediaType: f.type.startsWith('video') ? 'video' : 'image' });
    }
    setMedia(prev => [...prev, ...result]);
    setUploading(false);
  };

  const removeMedia = idx => setMedia(prev => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    const coords = locMode === 'current'
      ? currentCoord
      : pickedCoord ? [pickedCoord.lng, pickedCoord.lat] : currentCoord;
    if (!coords) { setError('Location is required'); return; }

    setSubmitting(true); setError('');
    try {
      await communityReportAPI.create({
        ...form,
        location: { type: 'Point', coordinates: coords, address },
        district,
        media,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div className="cf-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="cf-modal create"
        initial={{ scale: 0.92, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="cf-modal-header">
          <div className="cf-modal-header-left">
            <div className="cf-avatar">
              {currentUser?.profilePicture || currentUser?.googleAvatar
                ? <img src={currentUser.profilePicture || currentUser.googleAvatar} alt="me" />
                : <FiUser size={16} />}
            </div>
            <div>
              <h3>New Community Report</h3>
              <span className="cf-modal-as">{currentUser?.name || 'You'}</span>
            </div>
          </div>
          <button className="cf-icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="cf-modal-body">
          {error && <div className="cf-form-error"><FiAlertCircle size={14} /> {error}</div>}

          {/* Title */}
          <label className="cf-label">Title *</label>
          <input
            className="cf-input"
            placeholder="Brief description of the issue…"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          {/* Type + Severity */}
          <div className="cf-row-2">
            <div>
              <label className="cf-label">Type</label>
              <select className="cf-select" value={form.reportType} onChange={e => setForm(f => ({...f, reportType: e.target.value}))}>
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="cf-label">Severity</label>
              <div className="cf-severity-row">
                {SEVERITIES.map(s => (
                  <button key={s} className={`cf-sev-btn${form.severity === s ? ' active' : ''}`} data-sev={s} onClick={() => setForm(f => ({...f, severity: s}))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <label className="cf-label">Description</label>
          <textarea
            className="cf-textarea"
            rows={3}
            placeholder="Explain what you experienced or observed…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />

          {/* Media upload */}
          <label className="cf-label">Photos / Videos</label>
          <div className="cf-media-upload-area" onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            {uploading
              ? <><FiLoader size={18} className="spin" /> Processing…</>
              : <><FiImage size={18} /><FiVideo size={18} /> Click to add photos or videos</>
            }
          </div>
          {media.length > 0 && (
            <div className="cf-media-preview-row">
              {media.map((m, i) => (
                <div key={i} className="cf-media-preview-item">
                  {m.mediaType === 'video'
                    ? <video src={m.url} className="cf-preview-thumb" />
                    : <img src={m.url} alt="" className="cf-preview-thumb" />
                  }
                  <button className="cf-preview-remove" onClick={() => removeMedia(i)}><FiX size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Location */}
          <label className="cf-label">Location</label>
          {locError && <p className="cf-loc-error">{locError}</p>}
          <div className="cf-loc-toggle">
            {['current', 'custom'].map(m => (
              <button key={m} className={`cf-loc-btn${locMode === m ? ' active' : ''}`} onClick={() => setLocMode(m)}>
                {m === 'current' ? <><FiNavigation size={13} /> Current Location</> : <><FiMapPin size={13} /> Pick on Map</>}
              </button>
            ))}
          </div>

          {locMode === 'current' && (
            <div className="cf-current-loc-info">
              {currentCoord
                ? <><FiMapPin size={13} className="green" /> {address || `${currentCoord[1].toFixed(4)}, ${currentCoord[0].toFixed(4)}`}</>
                : 'Detecting location…'
              }
            </div>
          )}
          {locMode === 'custom' && (
            <>
              <LocationPicker onPick={ll => { setPickedCoord(ll); setAddress(`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`); }} />
              {pickedCoord && (
                <p className="cf-current-loc-info">
                  <FiMapPin size={13} className="green" /> Picked: {pickedCoord.lat.toFixed(5)}, {pickedCoord.lng.toFixed(5)}
                </p>
              )}
            </>
          )}

          <label className="cf-label">District / Area Name</label>
          <input
            className="cf-input"
            placeholder="e.g. Chennai, Velachery…"
            value={district}
            onChange={e => setDistrict(e.target.value)}
          />
        </div>

        <div className="cf-modal-footer">
          <button className="cf-btn ghost" onClick={onClose}>Cancel</button>
          <button className="cf-btn primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Report'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ── MAIN PAGE ─────────────────────────────────────────────────
   ══════════════════════════════════════════════════════════════ */
const CommunityFeed = () => {
  const { user } = useAuthContext();

  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filterMode,  setFilterMode]  = useState('all');   // all | nearby | district | trending
  const [districtQ,   setDistrictQ]   = useState('');
  const [districtInp, setDistrictInp] = useState('');
  const [userCoords,  setUserCoords]  = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // modals
  const [createOpen,   setCreateOpen]   = useState(false);
  const [commentPost,  setCommentPost]  = useState(null);
  const [banPost,      setBanPost]      = useState(null);

  /* ── get user coords ── */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  /* ── fetch posts ── */
  const fetchPosts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let data;
      if (filterMode === 'trending') {
        const r = await communityReportAPI.getTrending(30);
        data = r.data;
      } else if (filterMode === 'nearby' && userCoords) {
        const r = await communityReportAPI.getNearby(userCoords.lng, userCoords.lat, 10000);
        data = r.data;
      } else if (filterMode === 'district' && districtQ) {
        const r = await communityReportAPI.getReports({ district: districtQ, limit: 50 });
        data = r.data;
      } else {
        const r = await communityReportAPI.getReports({ limit: 50 });
        data = r.data;
      }
      setPosts(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load community reports');
    } finally { setLoading(false); }
  }, [filterMode, districtQ, userCoords]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  /* ── handlers ── */
  const handleVote = async (id, voteType) => {
    try {
      await communityReportAPI.vote(id, { voteType });
      fetchPosts();
    } catch {}
  };

  const handleFlag = async (id) => {
    try {
      await communityReportAPI.flag(id);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not flag');
    }
  };

  const handleBan = async (postId, banDuration, reason) => {
    try {
      await communityReportAPI.moderate(postId, { banDuration, reason });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not ban');
    }
  };

  const handleAddComment = async (postId, text) => {
    await communityReportAPI.addComment(postId, { text });
    // refresh only the comment list for this post
    try {
      const r = await communityReportAPI.getById(postId);
      setCommentPost(r.data);
      setPosts(prev => prev.map(p => p._id === postId ? r.data : p));
    } catch {}
  };

  /* ── filter label ── */
  const filterLabel = {
    all:      'All Reports',
    nearby:   'Nearby (10 km)',
    district: districtQ ? `District: ${districtQ}` : 'By District',
    trending: 'Trending',
  }[filterMode];

  return (
    <div className="cf-page">
      {/* ── Header ── */}
      <div className="cf-header">
        <div className="cf-header-left">
          <h1>Community Reports</h1>
          <p>Real issues reported by your community — like Reddit, for your neighbourhood.</p>
        </div>
        <button className="cf-new-btn" onClick={() => setCreateOpen(true)}>
          <FiPlus size={16} /> New Report
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="cf-filter-bar">
        {['all', 'nearby', 'district', 'trending'].map(m => (
          <button
            key={m}
            className={`cf-filter-btn${filterMode === m ? ' active' : ''}`}
            onClick={() => { setFilterMode(m); if (m !== 'district') setDistrictQ(''); }}
          >
            {m === 'all'      && 'All Posts'}
            {m === 'nearby'   && <><FiNavigation size={13} /> Nearby</>}
            {m === 'district' && <><FiMapPin size={13} /> District</>}
            {m === 'trending' && '🔥 Trending'}
          </button>
        ))}

        <button className="cf-filter-icon-btn" onClick={() => setShowFilters(f => !f)}>
          <FiFilter size={15} />
        </button>

        <button className="cf-filter-icon-btn" onClick={fetchPosts}>
          <FiRefreshCw size={15} />
        </button>
      </div>

      {/* District search */}
      <AnimatePresence>
        {(filterMode === 'district' || showFilters) && (
          <motion.div
            className="cf-district-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <FiMapPin size={15} />
            <input
              className="cf-district-input"
              placeholder="Enter district, city, or area name…"
              value={districtInp}
              onChange={e => setDistrictInp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setDistrictQ(districtInp), setFilterMode('district'))}
            />
            <button
              className="cf-btn primary sm"
              onClick={() => { setDistrictQ(districtInp); setFilterMode('district'); }}
            >Search</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-column layout ── */}
      <div className="cf-layout">

        {/* Feed */}
        <main className="cf-feed">
          {loading && (
            <div className="cf-loading">
              {[1,2,3].map(i => <div key={i} className="cf-skeleton" />)}
            </div>
          )}

          {!loading && error && (
            <div className="cf-error-banner">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="cf-empty">
              <span>📭</span>
              <h3>No reports {filterMode !== 'all' ? `for "${filterLabel}"` : 'yet'}</h3>
              <p>Be the first to report an issue in your area.</p>
              <button className="cf-btn primary" onClick={() => setCreateOpen(true)}>
                <FiPlus size={14} /> Create Report
              </button>
            </div>
          )}

          <AnimatePresence>
            {!loading && posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onVote={handleVote}
                onFlag={handleFlag}
                onBan={setBanPost}
                onCommentOpen={setCommentPost}
              />
            ))}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="cf-sidebar">
          <div className="cf-rules-card">
            <h4><FiShield size={15} /> Community Rules</h4>
            <ol className="cf-rules-list">
              {RULES.map((r, i) => (
                <li key={i}><span>{r.icon}</span> {r.text}</li>
              ))}
            </ol>
          </div>

          <div className="cf-sidebar-stats">
            <h4>📊 Feed Stats</h4>
            <p><strong>{posts.length}</strong> posts loaded</p>
            <p><strong>{filterLabel}</strong></p>
            {userCoords && (
              <p className="cf-coord-display">
                <FiMapPin size={12} />
                {userCoords.lat.toFixed(3)}, {userCoords.lng.toFixed(3)}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {createOpen  && <CreatePostModal  currentUser={user} onClose={() => setCreateOpen(false)}  onCreated={fetchPosts} />}
        {commentPost && <CommentsPanel    post={commentPost}  currentUser={user} onClose={() => setCommentPost(null)} onAddComment={handleAddComment} />}
        {banPost     && <BanModal         post={banPost}      onClose={() => setBanPost(null)} onBan={handleBan} />}
      </AnimatePresence>

      {/* FAB */}
      <button className="cf-fab" onClick={() => setCreateOpen(true)}>
        <FiPlus size={22} />
      </button>
    </div>
  );
};

export default CommunityFeed;
