import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiBell, FiLock, FiDownload,
  FiTrash2, FiEdit2, FiCheck, FiX, FiEye, FiEyeOff,
  FiAlertTriangle, FiGlobe, FiShield, FiInfo,
} from 'react-icons/fi';
import { userAPI } from '../services/api';
import '../styles/pages/Settings.css';

/* ── Toggle component ─────────────────────────────────────── */
const Toggle = ({ on, onChange }) => (
  <button
    className={`stg-toggle${on ? ' on' : ''}`}
    onClick={() => onChange(!on)}
    role="switch"
    aria-checked={on}
  >
    <span className="stg-toggle-knob" />
  </button>
);

/* ── Toast notification ───────────────────────────────────── */
const showToast = (msg, type = 'success') => {
  const el = document.createElement('div');
  el.className = `stg-toast stg-toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2800);
};

/* ══════════════════════════════════════════════════════════ */
const Settings = () => {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  /* Profile */
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', location: '',
    autismLevel: 'moderate', createdAt: '',
  });
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal]     = useState('');
  const editInputRef = useRef(null);

  /* Settings */
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    soundAlerts: true,
    dataSharing: true,
    darkMode: false,
    language: 'English',
  });

  /* Change password */
  const [pwOpen, setPwOpen]       = useState(false);
  const [pwData, setPwData]       = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwVis, setPwVis]         = useState({ cur: false, nw: false, cf: false });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwError, setPwError]     = useState('');

  /* Delete account */
  const [delOpen, setDelOpen]     = useState(false);
  const [delText, setDelText]     = useState('');
  const [deleting, setDeleting]   = useState(false);

  /* ── Load data ────────────────────────────────────────────── */
  useEffect(() => {
    userAPI.getProfile()
      .then(res => {
        const u = res.data;
        setProfile({
          name:        u.name        || '',
          email:       u.email       || '',
          phone:       u.phone       || '',
          location:    u.location    || '',
          autismLevel: u.autismLevel || 'moderate',
          createdAt:   u.createdAt   || '',
        });
        if (u.settings) {
          setSettings(s => ({ ...s, ...u.settings }));
          // Apply stored dark mode preference immediately on load
          document.documentElement.setAttribute(
            'data-theme',
            u.settings.darkMode ? 'dark' : 'light'
          );
        }
      })
      .catch(() => showToast('Could not load profile — check server.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Sync dark mode to <html data-theme="…"> ─────────────── */
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      settings.darkMode ? 'dark' : 'light'
    );
  }, [settings.darkMode]);

  useEffect(() => {
    if (editField) setTimeout(() => editInputRef.current?.focus(), 40);
  }, [editField]);

  /* ── Profile edit ─────────────────────────────────────────── */
  const startEdit  = (f) => { setEditField(f); setEditVal(profile[f]); };
  const cancelEdit = ()  => { setEditField(null); setEditVal(''); };

  const saveField = async (field) => {
    if (editVal.trim() === profile[field]) { cancelEdit(); return; }
    setSaving(true);
    try {
      const updated = { ...profile, [field]: editVal.trim() };
      await userAPI.updateProfile({
        name: updated.name, phone: updated.phone,
        location: updated.location, autismLevel: updated.autismLevel,
      });
      setProfile(updated);
      showToast('Profile updated ✓');
    } catch {
      showToast('Failed to save.', 'error');
    } finally {
      setSaving(false);
      cancelEdit();
    }
  };

  const handleEditKey = (e, f) => {
    if (e.key === 'Enter')  saveField(f);
    if (e.key === 'Escape') cancelEdit();
  };

  const saveAutismLevel = async (val) => {
    setSaving(true);
    try {
      await userAPI.updateProfile({ ...profile, autismLevel: val });
      setProfile(p => ({ ...p, autismLevel: val }));
      showToast('Support level saved ✓');
    } catch {
      showToast('Failed to save.', 'error');
    } finally { setSaving(false); }
  };

  /* ── Toggles ──────────────────────────────────────────────── */
  const handleToggle = async (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    try { await userAPI.updateSettings(next); }
    catch { setSettings(settings); showToast('Failed to save setting.', 'error'); }
  };

  const handleLanguage = async (lang) => {
    const next = { ...settings, language: lang };
    setSettings(next);
    try { await userAPI.updateSettings(next); showToast('Language saved ✓'); }
    catch { setSettings(settings); showToast('Failed to save.', 'error'); }
  };

  /* ── Change password ──────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    const { currentPassword, newPassword, confirm } = pwData;
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully ✓');
      setPwOpen(false);
      setPwData({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err?.response?.data?.error || 'Incorrect current password.');
    } finally { setPwSaving(false); }
  };

  /* ── Export ───────────────────────────────────────────────── */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ profile, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'neuronav-data.json' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Data exported ✓');
  };

  /* ── Delete account ───────────────────────────────────────── */
  const handleDelete = async () => {
    if (delText !== 'DELETE') return;
    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } catch { showToast('Failed to delete account.', 'error'); setDeleting(false); }
  };

  const fmt = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  /* ── Loading screen ────────────────────────────────────────── */
  if (loading) return (
    <div className="stg-loading">
      <div className="stg-spinner" />
      <p>Loading your settings…</p>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="stg-page">
      <motion.div className="stg-header" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Settings</h1>
        <p>Manage your preferences and account</p>
      </motion.div>

      <div className="stg-grid">

        {/* ── Profile ── */}
        <motion.div className="stg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stg-card-title"><FiUser size={20} /><h2>Profile</h2></div>

          <div className="stg-avatar-row">
            <div className="stg-avatar">{profile.name ? profile.name[0].toUpperCase() : '?'}</div>
            <div>
              <div className="stg-avatar-name">{profile.name || '—'}</div>
              <div className="stg-avatar-email">{profile.email}</div>
            </div>
          </div>

          <div className="stg-profile-list">
            {[
              { key: 'name',      label: 'Full Name',   editable: true  },
              { key: 'email',     label: 'Email',        editable: false },
              { key: 'phone',     label: 'Phone',        editable: true  },
              { key: 'location',  label: 'Location',     editable: true  },
              { key: 'createdAt', label: 'Member Since', editable: false, display: fmt(profile.createdAt) },
            ].map(f => (
              <div className="stg-profile-row" key={f.key}>
                <span className="stg-row-label">{f.label}</span>
                <div className="stg-row-right">
                  {editField === f.key ? (
                    <div className="stg-edit-inline">
                      <input
                        ref={editInputRef}
                        className="stg-edit-input"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => handleEditKey(e, f.key)}
                        disabled={saving}
                      />
                      <button className="stg-icon-btn green" onClick={() => saveField(f.key)} disabled={saving}><FiCheck size={14} /></button>
                      <button className="stg-icon-btn mute"  onClick={cancelEdit}><FiX size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="stg-row-val">{f.display !== undefined ? f.display : (profile[f.key] || '—')}</span>
                      {f.editable && (
                        <button className="stg-edit-btn" onClick={() => startEdit(f.key)}>
                          <FiEdit2 size={12} /> Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Support Level */}
            <div className="stg-profile-row">
              <span className="stg-row-label">Support Level</span>
              <div className="stg-row-right">
                <select
                  className="stg-select-sm"
                  value={profile.autismLevel}
                  onChange={e => saveAutismLevel(e.target.value)}
                  disabled={saving}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">High Support</option>
                </select>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <button className="stg-outline-btn" onClick={() => { setPwOpen(v => !v); setPwError(''); }}>
            <FiLock size={14} /> Change Password
          </button>
          <AnimatePresence>
            {pwOpen && (
              <motion.form className="stg-pw-form" onSubmit={handleChangePassword}
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {[
                  { id: 'currentPassword', label: 'Current Password', vis: 'cur' },
                  { id: 'newPassword',     label: 'New Password',     vis: 'nw'  },
                  { id: 'confirm',         label: 'Confirm New',      vis: 'cf'  },
                ].map(f => (
                  <div className="stg-pw-field" key={f.id}>
                    <label>{f.label}</label>
                    <div className="stg-pw-wrap">
                      <input
                        type={pwVis[f.vis] ? 'text' : 'password'}
                        value={pwData[f.id]}
                        onChange={e => setPwData(p => ({ ...p, [f.id]: e.target.value }))}
                        autoComplete="new-password"
                      />
                      <button type="button" className="stg-pw-eye"
                        onClick={() => setPwVis(v => ({ ...v, [f.vis]: !v[f.vis] }))}>
                        {pwVis[f.vis] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                {pwError && <p className="stg-pw-error"><FiAlertTriangle size={13} /> {pwError}</p>}
                <button className="stg-primary-btn" type="submit" disabled={pwSaving}>
                  {pwSaving ? 'Saving…' : 'Update Password'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div className="stg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stg-card-title"><FiBell size={20} /><h2>Notifications</h2></div>
          {[
            { key: 'notifications', label: 'Enable Notifications', desc: 'Get alerts about your wellness' },
            { key: 'emailAlerts',   label: 'Email Alerts',         desc: 'Receive insights via email' },
            { key: 'soundAlerts',   label: 'Sound Alerts',         desc: 'Play sounds for notifications' },
          ].map(s => (
            <div className="stg-setting-row" key={s.key}>
              <div className="stg-setting-info">
                <p className="stg-setting-label">{s.label}</p>
                <p className="stg-setting-desc">{s.desc}</p>
              </div>
              <Toggle on={settings[s.key]} onChange={v => handleToggle(s.key, v)} />
            </div>
          ))}
        </motion.div>

        {/* ── Privacy & Security ── */}
        <motion.div className="stg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stg-card-title"><FiShield size={20} /><h2>Privacy &amp; Security</h2></div>
          {[
            { key: 'dataSharing', label: 'Data Sharing', desc: 'Help improve our AI with anonymous data' },
            { key: 'darkMode',    label: 'Dark Mode',    desc: 'Switch to a darker interface theme' },
          ].map(s => (
            <div className="stg-setting-row" key={s.key}>
              <div className="stg-setting-info">
                <p className="stg-setting-label">{s.label}</p>
                <p className="stg-setting-desc">{s.desc}</p>
              </div>
              <Toggle on={settings[s.key]} onChange={v => handleToggle(s.key, v)} />
            </div>
          ))}
        </motion.div>

        {/* ── Other Preferences ── */}
        <motion.div className="stg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stg-card-title"><FiGlobe size={20} /><h2>Other Preferences</h2></div>
          <div className="stg-setting-row">
            <div className="stg-setting-info">
              <p className="stg-setting-label">Preferred Language</p>
              <p className="stg-setting-desc">App display language</p>
            </div>
            <select className="stg-select" value={settings.language} onChange={e => handleLanguage(e.target.value)}>
              {['English','Tamil','Hindi','Spanish','French','German'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="stg-setting-row">
            <div className="stg-setting-info">
              <p className="stg-setting-label">Data Export</p>
              <p className="stg-setting-desc">Download all your data as JSON</p>
            </div>
            <button className="stg-outline-btn sm" onClick={handleExport}>
              <FiDownload size={14} /> Export
            </button>
          </div>
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div className="stg-card danger" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="stg-card-title"><FiAlertTriangle size={20} /><h2>Danger Zone</h2></div>
          <p className="stg-danger-desc">Permanently delete your NeuroNav account and all data. This cannot be undone.</p>
          {!delOpen ? (
            <button className="stg-danger-btn" onClick={() => setDelOpen(true)}>
              <FiTrash2 size={14} /> Delete My Account
            </button>
          ) : (
            <motion.div className="stg-del-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>Type <strong>DELETE</strong> to confirm:</p>
              <input className="stg-del-input" value={delText} onChange={e => setDelText(e.target.value)} placeholder="DELETE" autoFocus />
              <div className="stg-del-btns">
                <button className="stg-danger-btn" disabled={delText !== 'DELETE' || deleting} onClick={handleDelete}>
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button className="stg-outline-btn sm" onClick={() => { setDelOpen(false); setDelText(''); }}>Cancel</button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── About ── */}
        <motion.div className="stg-card about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stg-card-title"><FiInfo size={20} /><h2>About NeuroNav</h2></div>
          <div className="stg-about">
            <p><strong>Version:</strong> 2.1.0</p>
            <p><strong>Last Updated:</strong> Feb 2026</p>
            <p>NeuroNav helps autistic individuals navigate sensory-challenging environments with AI-powered insights.</p>
            <div className="stg-about-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/contact">Contact Us</a>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Settings;
