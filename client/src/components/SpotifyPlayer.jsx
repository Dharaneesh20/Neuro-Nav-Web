import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMusic, FiPlay, FiPause, FiSkipForward } from 'react-icons/fi';
import '../styles/components/SpotifyPlayer.css';

const SpotifyPlayer = ({ onPlaylistSelect }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState('calm');

  // Curated Spotify playlist links for calming music
  const calmingPlaylists = [
    {
      id: 'calm',
      name: 'Deep Calm & Serenity',
      spotifyUri: 'spotify:playlist:37i9dQZF1DWSJHnPb02eNJ',
      embedUrl:
        'https://open.spotify.com/embed/playlist/37i9dQZF1DWSJHnPb02eNJ?utm_source=generator',
      color: '#6366f1',
    },
    {
      id: 'ambient',
      name: 'Environmental Sounds',
      spotifyUri: 'spotify:playlist:37i9dQZF1DWWcFuJNPQWUr',
      embedUrl:
        'https://open.spotify.com/embed/playlist/37i9dQZF1DWWcFuJNPQWUr?utm_source=generator',
      color: '#8b5cf6',
    },
    {
      id: 'focus',
      name: 'Focus & Meditation',
      spotifyUri: 'spotify:playlist:37i9dQZF1DXblVrMuM6c7s',
      embedUrl:
        'https://open.spotify.com/embed/playlist/37i9dQZF1DXblVrMuM6c7s?utm_source=generator',
      color: '#ec4899',
    },
    {
      id: 'sleep',
      name: 'Sleep & Relaxation',
      spotifyUri: 'spotify:playlist:37i9dQZF1DWZd79rJ6a7lp',
      embedUrl:
        'https://open.spotify.com/embed/playlist/37i9dQZF1DWZd79rJ6a7lp?utm_source=generator',
      color: '#06b6d4',
    },
  ];

  const currentPlaylist = calmingPlaylists.find((p) => p.id === selectedPlaylist);

  const handlePlaylistSelect = (playlistId) => {
    setSelectedPlaylist(playlistId);
    setIsPlaying(true);
    setShowPlayer(true);
    onPlaylistSelect?.(playlistId);
  };

  return (
    <div className="spotify-player-container">
      {/* Playlist Selector */}
      <motion.div
        className="playlist-selector"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="selector-title">
          <FiMusic className="selector-icon" />
          Calming Music
        </h3>

        <div className="playlist-grid">
          {calmingPlaylists.map((playlist) => (
            <motion.button
              key={playlist.id}
              className={`playlist-card ${
                selectedPlaylist === playlist.id ? 'active' : ''
              }`}
              style={{
                borderColor:
                  selectedPlaylist === playlist.id ? playlist.color : 'transparent',
              }}
              onClick={() => handlePlaylistSelect(playlist.id)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="playlist-icon" style={{ backgroundColor: playlist.color }}>
                <FiMusic />
              </div>
              <span className="playlist-name">{playlist.name}</span>
              {selectedPlaylist === playlist.id && isPlaying && (
                <motion.div
                  className="playing-indicator"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ▶
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Spotify Player Embed */}
      {showPlayer && currentPlaylist && (
        <motion.div
          className="spotify-embed-wrapper"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="embed-container">
            <iframe
              style={{
                borderRadius: '12px',
                width: '100%',
                height: '560px',
                maxWidth: '100%',
              }}
              src={currentPlaylist.embedUrl}
              frameBorder="0"
              allowFullScreen=""
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={currentPlaylist.name}
            />
          </div>

          {/* Control Buttons */}
          <div className="player-controls">
            <motion.button
              className="control-btn play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
              {isPlaying ? 'Playing' : 'Play'}
            </motion.button>

            <motion.button
              className="control-btn close-btn"
              onClick={() => setShowPlayer(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Hide Player
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SpotifyPlayer;
