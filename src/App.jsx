import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const playerRef = useRef(null);

  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyA-xsEx80oNfIYNjXBDC6t1IGxwQIQPsvs';

  useEffect(() => {
    searchTracks('popular music 2024');
  }, []);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onStateChange: onPlayerStateChange,
        },
      });
    };
  }, []);

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      handleNext();
    }
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    }
    if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  };

  const searchTracks = async (query) => {
    if (!query.trim()) return;

    setSearching(true);
    setError('');
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query + ' music')}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(`YouTube API Error: ${data.error.message}`);
        setTracks([]);
        return;
      }

      if (data.items && data.items.length > 0) {
        const tracksData = data.items.map((item) => ({
          id: item.id.videoId,
          name: item.snippet.title,
          artist_name: item.snippet.channelTitle,
          image: item.snippet.thumbnails.medium.url,
          duration: 0,
        }));
        setTracks(tracksData);
        setCurrentTrack(0);
      } else {
        setTracks([]);
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
      setTracks([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTracks(searchQuery);
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current || !tracks[currentTrack]) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    const nextTrack = (currentTrack + 1) % tracks.length;
    setCurrentTrack(nextTrack);
    loadAndPlay(nextTrack);
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    const prevTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    setCurrentTrack(prevTrack);
    loadAndPlay(prevTrack);
  };

  const loadAndPlay = (index) => {
    if (!playerRef.current || !tracks[index]) return;
    playerRef.current.loadVideoById(tracks[index].id);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
    }
  };

  const track = tracks[currentTrack];

  useEffect(() => {
    if (track && playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.id);
    }
  }, [currentTrack]);

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">♪</div>
          <div className="app-name">Audio Wave</div>
        </div>
        <div className="nav-item active">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Home</span>
        </div>
        <div className="nav-item">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <span>Search</span>
        </div>
        <div className="nav-item">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
          </svg>
          <span>Library</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <form className="search-container" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-box"
              placeholder="Search songs, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" disabled={searching}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {searching && <div className="loading">Searching YouTube Music...</div>}
          {error && <div className="error-message">{error}</div>}

          {!searching && !error && (
            <>
              <h2 className="section-title">
                {searchQuery ? `Results for "${searchQuery}"` : 'Popular Music'}
              </h2>
              {tracks.length === 0 ? (
                <div className="no-results">No tracks found. Try searching for your favorite songs!</div>
              ) : (
                <div className="track-grid">
                  {tracks.map((t, index) => (
                    <div
                      key={t.id}
                      className={`track-card ${index === currentTrack ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentTrack(index);
                        loadAndPlay(index);
                      }}
                    >
                      <img src={t.image} alt={t.name} className="track-thumbnail" />
                      <div className="track-name">{t.name}</div>
                      <div className="track-artist">{t.artist_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Player */}
        {track && (
          <div className="bottom-player">
            <div className="player-track-info">
              <img
                src={track.image}
                alt={track.name}
                className={`player-thumbnail ${isPlaying ? 'playing' : ''}`}
              />
              <div className="player-details">
                <div className="player-track-name">{track.name}</div>
                <div className="player-track-artist">{track.artist_name}</div>
              </div>
            </div>

            <div className="player-controls">
              <div className="control-buttons">
                <button className="control-button" onClick={handlePrevious}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button className="control-button play-button" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button className="control-button" onClick={handleNext}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              <div className="progress-container">
                <span className="time">0:00</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
                <span className="time">0:00</span>
              </div>
            </div>

            <div className="player-right">
              <div className="volume-control">
                <svg className="volume-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden YouTube Player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>
    </div>
  );
}

export default App;
