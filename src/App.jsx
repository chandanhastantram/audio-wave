import { useState, useRef, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import './App.css';

function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const playerRef = useRef(null);

  // YouTube API Key from environment variable
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Load default tracks on mount
  useEffect(() => {
    searchTracks('popular music 2024');
  }, []);

  // Load YouTube IFrame API
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
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };
  }, []);

  const onPlayerReady = (event) => {
    console.log('Player ready');
  };

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
      console.log('API Key:', YOUTUBE_API_KEY ? 'Present' : 'Missing');
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query + ' music')}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
      console.log('Fetching:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);
      
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
      console.error('Error searching tracks:', error);
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

  // Watch for track changes
  useEffect(() => {
    if (track && playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.id);
    }
  }, [currentTrack]);

  return (
    <div className="app">
      <div className="player-container">
        <h1 className="app-title">Audio Wave</h1>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists... (e.g., The Weeknd, Arijit Singh)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button" disabled={searching}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searching && <div className="loading">Searching YouTube Music...</div>}
        
        {error && <div className="error">{error}</div>}

        {track && (
          <>
            <div className="track-display">
              <img src={track.image} alt={track.name} className="track-image" />
            </div>

            <div className="track-info">
              <h2 className="track-title">{track.name}</h2>
              <p className="track-artist">{track.artist_name}</p>
            </div>

            <div className="controls">
              <button className="control-btn" onClick={handlePrevious}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button className="control-btn play-btn" onClick={handlePlayPause}>
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

              <button className="control-btn" onClick={handleNext}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            <div className="volume-section">
              <svg viewBox="0 0 24 24" fill="currentColor" className="volume-icon">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-bar"
              />
            </div>
          </>
        )}

        <div className="playlist">
          <h3 className="playlist-title">
            {searchQuery ? `Results for "${searchQuery}"` : 'Popular Music'}
          </h3>
          {tracks.length === 0 && !searching && (
            <div className="no-results">No tracks found. Try searching for your favorite songs!</div>
          )}
          {tracks.map((t, index) => (
            <div
              key={t.id}
              className={`playlist-item ${index === currentTrack ? 'active' : ''}`}
              onClick={() => {
                setCurrentTrack(index);
                loadAndPlay(index);
              }}
            >
              <img src={t.image} alt={t.name} className="playlist-item-image" />
              <div className="playlist-item-info">
                <div className="playlist-item-title">{t.name}</div>
                <div className="playlist-item-artist">{t.artist_name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Hidden YouTube Player */}
        <div id="youtube-player" style={{ display: 'none' }}></div>
      </div>
    </div>
  );
}

export default App;
