import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import { moviesAPI } from '../api/client';
import { Search, MapPin, ChevronDown, Film, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('mumbai');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [featuredMovie, setFeaturedMovie] = useState(null);

  // Fetch cities and movies on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [moviesRes, citiesRes] = await Promise.all([
          moviesAPI.nowPlaying(),
          moviesAPI.getCities(),
        ]);
        const movieList = moviesRes.data.movies || [];
        setMovies(movieList);
        setCities(citiesRes.data.cities || []);

        // Pick a random featured movie with a backdrop
        const withBackdrop = movieList.filter((m) => m.backdropUrl);
        if (withBackdrop.length > 0) {
          setFeaturedMovie(withBackdrop[Math.floor(Math.random() * withBackdrop.length)]);
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await moviesAPI.search(searchQuery.trim());
        setSearchResults(data.movies || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const displayMovies = searchResults !== null ? searchResults : movies;
  const currentCity = cities.find((c) => c.id === selectedCity);

  return (
    <div className="container">
      {/* Featured Hero */}
      {featuredMovie && !searchResults && (
        <motion.div
          className="movie-hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="movie-hero-backdrop">
            <img src={featuredMovie.backdropUrl} alt="" />
            <div className="movie-hero-gradient" />
          </div>
          <div className="movie-hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="movie-hero-badge">
                <TrendingUp size={14} />
                Now Showing
              </span>
              <h1 className="movie-hero-title">{featuredMovie.title}</h1>
              <p className="movie-hero-overview">
                {featuredMovie.overview?.slice(0, 160)}
                {featuredMovie.overview?.length > 160 ? '...' : ''}
              </p>
              <motion.button
                className="btn btn-primary btn-lg"
                onClick={() => handleMovieClick(featuredMovie)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                id="hero-book-btn"
              >
                <Film size={18} />
                Book Tickets
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Controls Bar */}
      <motion.div
        className="movies-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* City Selector */}
        <div className="city-selector" id="city-selector">
          <button
            className="city-selector-btn"
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
          >
            <MapPin size={16} />
            <span>{currentCity?.name || 'Select City'}</span>
            <ChevronDown size={14} className={cityDropdownOpen ? 'rotate-180' : ''} />
          </button>

          <AnimatePresence>
            {cityDropdownOpen && (
              <motion.div
                className="city-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {cities.map((city) => (
                  <button
                    key={city.id}
                    className={`city-dropdown-item ${city.id === selectedCity ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCity(city.id);
                      setCityDropdownOpen(false);
                    }}
                  >
                    <span>{city.name}</span>
                    <span className="city-venue-count">{city.venueCount} cinemas</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <div className="movies-search" id="movies-search">
          <Search size={18} className="movies-search-icon" />
          <input
            type="text"
            className="movies-search-input"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <Loader2 size={16} className="movies-search-spinner" />
          )}
        </div>
      </motion.div>

      {/* Section Header */}
      <motion.div
        className="movies-section-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2>
          {searchResults !== null ? (
            <>
              <Search size={20} />
              Results for "{searchQuery}"
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Now Showing in {currentCity?.name || 'India'}
            </>
          )}
        </h2>
        {searchResults !== null && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSearchResults(null);
            }}
          >
            Clear search
          </button>
        )}
      </motion.div>

      {/* Movie Grid */}
      {loading ? (
        <div className="movie-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="movie-card-skeleton">
              <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ height: 18, width: '80%', marginTop: 12, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 14, width: '50%', marginTop: 8, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : displayMovies.length > 0 ? (
        <motion.div
          className="movie-grid"
          key={searchResults ? 'search' : 'all'}
        >
          {displayMovies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={handleMovieClick}
              index={i}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-state-icon">🎭</div>
          <h3 className="empty-state-title">
            {searchResults !== null ? 'No movies found' : 'No movies showing right now'}
          </h3>
          <p className="empty-state-text">
            {searchResults !== null
              ? `Try a different search term`
              : 'Check back later for new releases'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
