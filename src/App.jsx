import { useState, useRef, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import './App.css';

function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const audioRef = useRef(null);

  // Load default tracks on mount
  useEffect(() => {
    searchTracks('popular songs');
  }, []);

  const searchTracks = async (query) => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://musicapi.x007.workers.dev/search?q=${encodeURIComponent(query)}&searchEngine=gaama`
      );
      const data = await response.json();
      
      if (data.status === 200 && data.response && data.response.length > 0) {
        // Fetch stream URLs for each track
        const tracksWithUrls = await Promise.all(
          data.response.slice(0, 20).map(async (track) => {
            try {
              const fetchResponse = await fetch(
                `https://musicapi.x007.workers.dev/fetch?id=${track.id}`
              );
              const fetchData = await fetchResponse.json();
              return {
                id: track.id,
                name: track.title,
                artist_name: 'Unknown Artist',
                audio: fetchData.response,
                image: track.img,
                duration: 180 // Default duration
              };
            } catch (err) {
              return null;
            }
          })
        );
        
        const validTracks = tracksWithUrls.filter(t => t !== null);
        setTracks(validTracks);
        setCurrentTrack(0);
      } else {
        setTracks([]);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !tracks[currentTrack]) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, tracks]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !tracks[currentTrack]) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Play error:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(err => console.error('Play error:', err)), 100);
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(err => console.error('Play error:', err)), 100);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = e.target.value;
    setCurrentTime(e.target.value);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const track = tracks[currentTrack];

  return (
    <div className="app">
      <div className="player-container">
        <h1 className="app-title">Audio Wave</h1>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists... (e.g., Pathaan, Arijit Singh)"
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

        {searching && <div className="loading">Searching for music...</div>}

        {track && (
          <>
            <Visualizer audioElement={audioRef.current} isPlaying={isPlaying} />

            <div className="track-info">
              <h2 className="track-title">{track.name}</h2>
              <p className="track-artist">{track.artist_name}</p>
            </div>

            <div className="progress-section">
              <span className="time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="progress-bar"
              />
              <span className="time">{formatTime(duration)}</span>
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
            {searchQuery ? `Results for "${searchQuery}"` : 'Popular Tracks'}
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
                setIsPlaying(true);
                setTimeout(() => audioRef.current?.play().catch(err => console.error('Play error:', err)), 100);
              }}
            >
              <div className="playlist-item-info">
                <div className="playlist-item-title">{t.name}</div>
                <div className="playlist-item-artist">{t.artist_name}</div>
              </div>
              <div className="playlist-item-duration">{formatTime(t.duration)}</div>
            </div>
          ))}
        </div>

        {track && <audio ref={audioRef} src={track.audio} crossOrigin="anonymous" />}
      </div>
    </div>
  );
}

export default App;
