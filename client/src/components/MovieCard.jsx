import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
import { TMDB_GENRES } from '../utils/constants';

export default function MovieCard({ movie, onClick, index = 0 }) {
  const genres = (movie.genreIds || [])
    .slice(0, 2)
    .map((id) => TMDB_GENRES[id])
    .filter(Boolean);

  const releaseYear = movie.releaseDate?.split('-')[0];

  return (
    <motion.div
      className="movie-card"
      onClick={() => onClick(movie)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      id={`movie-card-${movie.id}`}
    >
      {/* Poster */}
      <div className="movie-card-poster">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
          />
        ) : (
          <div className="movie-card-poster-placeholder">
            🎬
          </div>
        )}

        {/* Rating badge */}
        {movie.voteAverage > 0 && (
          <div className="movie-card-rating">
            <Star size={11} />
            <span>{movie.voteAverage}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="movie-card-overlay">
          <span className="movie-card-cta">Book Now</span>
        </div>
      </div>

      {/* Info */}
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-meta">
          {genres.length > 0 && (
            <div className="movie-card-genres">
              {genres.map((g) => (
                <span key={g} className="movie-card-genre-tag">{g}</span>
              ))}
            </div>
          )}
          {releaseYear && (
            <div className="movie-card-year">
              <Calendar size={11} />
              <span>{releaseYear}</span>
            </div>
          )}
        </div>
        {movie.language && (
          <span className="movie-card-lang">{movie.language}</span>
        )}
      </div>
    </motion.div>
  );
}
