import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { moviesAPI } from '../api/client';
import {
  ArrowLeft, Star, Clock, Calendar, MapPin, Play, Users,
  ChevronDown, Loader2, Zap, Film,
} from 'lucide-react';

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [venues, setVenues] = useState([]);
  const [cities, setCities] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedCity, setSelectedCity] = useState('mumbai');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Fetch movie details on mount
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const [movieRes, citiesRes] = await Promise.all([
          moviesAPI.getMovie(id),
          moviesAPI.getCities(),
        ]);
        setMovie(movieRes.data.movie);
        setCities(citiesRes.data.cities || []);
      } catch (err) {
        console.error('Failed to fetch movie:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  // Fetch venues when city or date changes
  useEffect(() => {
    if (!id) return;
    const fetchVenues = async () => {
      setVenuesLoading(true);
      try {
        const { data } = await moviesAPI.getVenues(id, selectedCity, selectedDate || undefined);
        setVenues(data.venues || []);
        setDates(data.dates || []);
        if (!selectedDate && data.dates?.length > 0) {
          setSelectedDate(data.dates[0].value);
        }
      } catch (err) {
        console.error('Failed to fetch venues:', err);
      } finally {
        setVenuesLoading(false);
      }
    };
    fetchVenues();
  }, [id, selectedCity, selectedDate]);

  const handleShowtimeClick = async (venue, showtime) => {
    try {
      const { data } = await moviesAPI.getSeats(id, venue.id, showtime.id);
      navigate('/show', {
        state: {
          url: `https://in.bookmyshow.com/${selectedCity}/movies/${id}`,
          show: {
            movieName: movie.title,
            venue: venue.name,
            showDate: selectedDate,
            showTime: showtime.time,
            language: movie.language,
            format: showtime.format,
            posterUrl: movie.posterUrl,
          },
          seatLayout: data.seatLayout,
          availableSeats: data.availableSeats,
          venueId: venue.id,
          showtimeId: showtime.id,
          movieId: id,
        },
      });
    } catch (err) {
      console.error('Failed to fetch seats:', err);
    }
  };

  const formatRuntime = (mins) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const currentCity = cities.find((c) => c.id === selectedCity);

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)', marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 32, width: '50%', borderRadius: 8, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '70%', borderRadius: 8 }} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Movie not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Backdrop Hero */}
      <div className="movie-detail-hero">
        {movie.backdropUrl && (
          <>
            <img className="movie-detail-backdrop" src={movie.backdropUrl} alt="" />
            <div className="movie-detail-hero-gradient" />
          </>
        )}

        <div className="container movie-detail-hero-content">
          <motion.button
            className="btn btn-ghost"
            onClick={() => navigate('/')}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            id="back-btn"
            style={{ marginBottom: 'var(--space-lg)', color: '#fff' }}
          >
            <ArrowLeft size={16} />
            Back
          </motion.button>

          <div className="movie-detail-info">
            {/* Poster */}
            <motion.div
              className="movie-detail-poster"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} />
              ) : (
                <div className="movie-card-poster-placeholder" style={{ width: '100%', height: '100%' }}>🎬</div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              className="movie-detail-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="movie-detail-title">{movie.title}</h1>

              {movie.tagline && (
                <p className="movie-detail-tagline">"{movie.tagline}"</p>
              )}

              <div className="movie-detail-badges">
                {movie.voteAverage > 0 && (
                  <span className="movie-badge movie-badge--rating">
                    <Star size={14} />
                    {movie.voteAverage}/10
                    {movie.voteCount > 0 && (
                      <span className="movie-badge-sub">({(movie.voteCount / 1000).toFixed(1)}K votes)</span>
                    )}
                  </span>
                )}
                {movie.certification && (
                  <span className="movie-badge movie-badge--cert">{movie.certification}</span>
                )}
                {movie.runtime > 0 && (
                  <span className="movie-badge">
                    <Clock size={14} />
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
                {movie.releaseDate && (
                  <span className="movie-badge">
                    <Calendar size={14} />
                    {new Date(movie.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres?.length > 0 && (
                <div className="movie-detail-genres">
                  {movie.genres.map((g) => (
                    <span key={g} className="movie-card-genre-tag">{g}</span>
                  ))}
                </div>
              )}

              {/* Languages */}
              {movie.spokenLanguages?.length > 0 && (
                <p className="movie-detail-lang">
                  <Film size={14} />
                  {movie.spokenLanguages.join(', ')}
                </p>
              )}

              {/* Trailer button */}
              {movie.videos?.length > 0 && (
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => setTrailerOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="trailer-btn"
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  <Play size={16} />
                  Watch Trailer
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Overview */}
        {movie.overview && (
          <motion.div
            className="glass-card"
            style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>About the Movie</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{movie.overview}</p>
          </motion.div>
        )}

        {/* Cast */}
        {movie.cast?.length > 0 && (
          <motion.div
            style={{ marginTop: 'var(--space-xl)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
              <Users size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Cast
            </h3>
            <div className="cast-scroll">
              {movie.cast.map((person) => (
                <div key={person.id} className="cast-card">
                  {person.profilePath ? (
                    <img src={person.profilePath} alt={person.name} className="cast-card-img" loading="lazy" />
                  ) : (
                    <div className="cast-card-img cast-card-placeholder">👤</div>
                  )}
                  <p className="cast-card-name">{person.name}</p>
                  <p className="cast-card-char">{person.character}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Venue Selection Section */}
        <motion.div
          style={{ marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-3xl)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
            <Zap size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-cyan)' }} />
            Book <span className="text-gradient">Tickets</span>
          </h2>

          {/* City + Date Controls */}
          <div className="venue-controls">
            {/* City */}
            <div className="city-selector" style={{ position: 'relative' }}>
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
                        onClick={() => { setSelectedCity(city.id); setCityDropdownOpen(false); }}
                      >
                        <span>{city.name}</span>
                        <span className="city-venue-count">{city.venueCount} cinemas</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Tabs */}
            <div className="date-tabs">
              {dates.map((d) => (
                <button
                  key={d.value}
                  className={`date-tab ${d.value === selectedDate ? 'active' : ''}`}
                  onClick={() => setSelectedDate(d.value)}
                >
                  <span className="date-tab-day">{d.dayName}</span>
                  <span className="date-tab-date">{d.date}</span>
                  <span className="date-tab-month">{d.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Venues List */}
          {venuesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : venues.length > 0 ? (
            <div className="venue-list">
              {venues.map((venue, vi) => (
                <motion.div
                  key={venue.id}
                  className="glass-card venue-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: vi * 0.06 }}
                >
                  <div className="venue-card-header">
                    <div>
                      <h4 className="venue-card-name">{venue.name}</h4>
                      <p className="venue-card-location">
                        <MapPin size={13} />
                        {venue.location}, {venue.city}
                      </p>
                    </div>
                    <div className="venue-card-pricing">
                      {venue.pricing.map((p) => (
                        <span key={p.name} className="venue-price-tag">
                          {p.price} <small>{p.name}</small>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="venue-card-showtimes">
                    {venue.showtimes.map((st) => (
                      <motion.button
                        key={st.id}
                        className={`showtime-chip ${!st.available ? 'sold-out' : ''} ${st.fastFilling ? 'fast-filling' : ''}`}
                        onClick={() => st.available && handleShowtimeClick(venue, st)}
                        disabled={!st.available}
                        whileHover={st.available ? { scale: 1.08 } : {}}
                        whileTap={st.available ? { scale: 0.95 } : {}}
                      >
                        <span className="showtime-time">{st.time}</span>
                        <span className="showtime-format">{st.format}</span>
                        {st.fastFilling && st.available && (
                          <span className="showtime-fast">Fast Filling</span>
                        )}
                        {!st.available && (
                          <span className="showtime-sold">Sold Out</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎪</div>
              <h3 className="empty-state-title">No shows available</h3>
              <p className="empty-state-text">Try selecting a different city or date</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {trailerOpen && movie.videos?.[0] && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTrailerOpen(false)}
          >
            <motion.div
              className="trailer-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setTrailerOpen(false)}>✕</button>
              <div className="trailer-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${movie.videos[0].key}?autoplay=1`}
                  title={movie.videos[0].name}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
