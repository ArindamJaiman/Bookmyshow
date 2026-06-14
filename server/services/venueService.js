import logger from '../utils/logger.js';

/**
 * Generates realistic venue/showtime data for Indian cinema chains.
 * Uses real cinema chain names and real mall names per city.
 */

const CITIES = {
  mumbai: {
    name: 'Mumbai',
    region: 'IN-MH',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX Citi Mall', location: 'Andheri West', tier: 'premium' },
      { chain: 'PVR INOX', name: 'PVR INOX Phoenix Palladium', location: 'Lower Parel', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'PVR INOX R-City Mall', location: 'Ghatkopar', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Megaplex', location: 'Inorbit Mall, Malad', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis Viviana Mall', location: 'Thane', tier: 'standard' },
      { chain: 'Cinépolis', name: 'Cinépolis Fun Republic', location: 'Andheri West', tier: 'standard' },
      { chain: 'Miraj', name: 'Miraj Cinemas', location: 'Dombivli', tier: 'budget' },
      { chain: 'Carnival', name: 'Carnival Cinemas IMAX', location: 'Wadala', tier: 'premium' },
    ],
  },
  delhi: {
    name: 'Delhi-NCR',
    region: 'IN-DL',
    venues: [
      { chain: 'PVR INOX', name: 'PVR Director\'s Cut', location: 'Ambience Mall, Vasant Kunj', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'PVR INOX Select CityWalk', location: 'Saket', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'PVR INOX Pacific Mall', location: 'Tagore Garden', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Nehru Place', location: 'Nehru Place', tier: 'standard' },
      { chain: 'Cinépolis', name: 'Cinépolis DLF Mall of India', location: 'Noida', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis DLF CyberHub', location: 'Gurugram', tier: 'premium' },
      { chain: 'Miraj', name: 'Miraj Cinemas GIP Mall', location: 'Noida', tier: 'standard' },
    ],
  },
  bangalore: {
    name: 'Bengaluru',
    region: 'IN-KA',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX Orion Mall', location: 'Rajajinagar', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'PVR INOX Forum Mall', location: 'Koramangala', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Garuda Mall', location: 'Magrath Road', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis Royal Meenakshi', location: 'Bannerghatta Road', tier: 'standard' },
      { chain: 'Cinépolis', name: 'Cinépolis ETA Mall', location: 'Basveshwara Nagar', tier: 'standard' },
      { chain: 'PVR INOX', name: 'PVR INOX VR Bengaluru', location: 'Whitefield', tier: 'premium' },
    ],
  },
  hyderabad: {
    name: 'Hyderabad',
    region: 'IN-TG',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX Next Galleria', location: 'Panjagutta', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX GVK One', location: 'Banjara Hills', tier: 'luxury' },
      { chain: 'AMB Cinemas', name: 'AMB Cinemas', location: 'Gachibowli', tier: 'luxury' },
      { chain: 'Cinépolis', name: 'Cinépolis Manjeera Mall', location: 'Kukatpally', tier: 'standard' },
      { chain: 'Miraj', name: 'Miraj Cinemas Rayadurgam', location: 'Kondapur', tier: 'standard' },
      { chain: 'Asian', name: 'Asian Multiplex', location: 'Uppal', tier: 'budget' },
    ],
  },
  chennai: {
    name: 'Chennai',
    region: 'IN-TN',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX VR Chennai', location: 'Anna Nagar', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'INOX National', location: 'Arcot Road', tier: 'premium' },
      { chain: 'Rohini', name: 'Rohini Silver Screens', location: 'Koyambedu', tier: 'standard' },
      { chain: 'SPI Cinemas', name: 'SPI Palazzo', location: 'Nexus Vijaya Mall', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis OMR', location: 'Sholinganallur', tier: 'standard' },
      { chain: 'AGS', name: 'AGS Cinemas', location: 'T. Nagar', tier: 'standard' },
    ],
  },
  kolkata: {
    name: 'Kolkata',
    region: 'IN-WB',
    venues: [
      { chain: 'PVR INOX', name: 'INOX Quest Mall', location: 'Park Circus', tier: 'luxury' },
      { chain: 'PVR INOX', name: 'PVR INOX South City', location: 'Prince Anwar Shah Road', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Forum Courtyard', location: 'Elgin Road', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis Acropolis Mall', location: 'Kasba', tier: 'standard' },
      { chain: 'Miraj', name: 'Miraj Cinemas Newtown', location: 'Newtown', tier: 'standard' },
    ],
  },
  pune: {
    name: 'Pune',
    region: 'IN-MH',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX Phoenix Marketcity', location: 'Viman Nagar', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Bund Garden', location: 'Bund Garden Road', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis Westend Mall', location: 'Aundh', tier: 'standard' },
      { chain: 'Cinépolis', name: 'Cinépolis Seasons Mall', location: 'Magarpatta', tier: 'standard' },
      { chain: 'PVR INOX', name: 'PVR INOX Pavilion Mall', location: 'Senapati Bapat Road', tier: 'premium' },
    ],
  },
  ahmedabad: {
    name: 'Ahmedabad',
    region: 'IN-GJ',
    venues: [
      { chain: 'PVR INOX', name: 'PVR INOX Acropolis', location: 'Thaltej', tier: 'premium' },
      { chain: 'Cinépolis', name: 'Cinépolis Alpha One', location: 'Vastrapur', tier: 'premium' },
      { chain: 'PVR INOX', name: 'INOX Ahmedabad One', location: 'Vastrapur', tier: 'standard' },
      { chain: 'Rajhans', name: 'Rajhans Cinemas', location: 'Paldi', tier: 'budget' },
      { chain: 'Miraj', name: 'Miraj Cinemas', location: 'Naranpura', tier: 'standard' },
    ],
  },
};

const TIER_PRICING = {
  luxury: {
    sections: [
      { name: 'RECLINER', price: 600, rows: 2, seatsPerRow: 8, aisles: [3, 6] },
      { name: 'PRIME', price: 450, rows: 4, seatsPerRow: 14, aisles: [4, 11] },
      { name: 'CLASSIC', price: 320, rows: 4, seatsPerRow: 16, aisles: [5, 12] },
    ],
  },
  premium: {
    sections: [
      { name: 'PLATINUM RECLINER', price: 400, rows: 2, seatsPerRow: 10, aisles: [4, 7] },
      { name: 'GOLD', price: 280, rows: 5, seatsPerRow: 16, aisles: [4, 13] },
      { name: 'SILVER', price: 150, rows: 5, seatsPerRow: 20, aisles: [5, 16] },
    ],
  },
  standard: {
    sections: [
      { name: 'GOLD', price: 250, rows: 3, seatsPerRow: 14, aisles: [4, 11] },
      { name: 'SILVER', price: 180, rows: 5, seatsPerRow: 18, aisles: [5, 14] },
      { name: 'BRONZE', price: 120, rows: 4, seatsPerRow: 20, aisles: [5, 16] },
    ],
  },
  budget: {
    sections: [
      { name: 'BALCONY', price: 180, rows: 3, seatsPerRow: 16, aisles: [5, 12] },
      { name: 'STALL', price: 100, rows: 6, seatsPerRow: 22, aisles: [6, 17] },
    ],
  },
};

// Standard showtime slots
const SHOWTIME_SLOTS = [
  '09:00 AM', '09:30 AM',
  '10:15 AM', '10:45 AM',
  '12:00 PM', '12:30 PM',
  '01:15 PM', '01:45 PM',
  '03:00 PM', '03:30 PM',
  '04:15 PM', '04:45 PM',
  '06:00 PM', '06:30 PM',
  '07:15 PM', '07:45 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM',
];

class VenueService {
  /**
   * Get available cities.
   */
  getCities() {
    return Object.entries(CITIES).map(([key, city]) => ({
      id: key,
      name: city.name,
      venueCount: city.venues.length,
    }));
  }

  /**
   * Get venues with showtimes for a specific movie in a city.
   * Uses deterministic seeding based on movieId+date to ensure consistency.
   */
  getVenuesForMovie(movieId, cityId, date) {
    const city = CITIES[cityId];
    if (!city) {
      throw new Error(`Unknown city: ${cityId}`);
    }

    // Use movieId + date as seed for deterministic randomness
    const seed = this.hashCode(`${movieId}-${date}-${cityId}`);
    const rng = this.seededRandom(seed);

    // Select a subset of venues (4-7 venues show this movie)
    const venueCount = 4 + Math.floor(rng() * Math.min(4, city.venues.length - 3));
    const shuffled = [...city.venues].sort(() => rng() - 0.5);
    const selectedVenues = shuffled.slice(0, Math.min(venueCount, city.venues.length));

    return selectedVenues.map((venue) => {
      // Each venue gets 2-5 showtimes
      const showtimeCount = 2 + Math.floor(rng() * 4);
      const availableSlots = [...SHOWTIME_SLOTS].sort(() => rng() - 0.5);
      const selectedSlots = availableSlots
        .slice(0, showtimeCount)
        .sort((a, b) => this.timeToMinutes(a) - this.timeToMinutes(b));

      const showtimes = selectedSlots.map((time) => {
        // Determine fill rate (some shows are more full than others)
        const fillRate = 0.1 + rng() * 0.55; // 10-65% filled
        const isFastFilling = fillRate > 0.5;

        return {
          id: `${movieId}-${venue.name.replace(/\s+/g, '-').toLowerCase()}-${time.replace(/[\s:]/g, '')}`,
          time,
          available: !isFastFilling || rng() > 0.1, // occasionally sold out
          fastFilling: isFastFilling,
          format: rng() > 0.7 ? '3D' : '2D',
          fillRate: Math.round(fillRate * 100),
        };
      });

      const pricing = TIER_PRICING[venue.tier];

      return {
        id: `venue-${venue.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: venue.name,
        chain: venue.chain,
        location: venue.location,
        city: city.name,
        tier: venue.tier,
        showtimes,
        pricing: pricing.sections.map((s) => ({
          name: s.name,
          price: `₹${s.price}`,
        })),
      };
    });
  }

  /**
   * Generate a seat layout for a specific venue+showtime.
   */
  generateSeatLayout(venueId, showtimeId) {
    // Extract tier from venueId
    const allVenues = Object.values(CITIES).flatMap((c) => c.venues);
    const venue = allVenues.find(
      (v) => `venue-${v.name.replace(/\s+/g, '-').toLowerCase()}` === venueId
    );
    const tier = venue?.tier || 'standard';
    const pricing = TIER_PRICING[tier];

    // Deterministic seeding
    const seed = this.hashCode(`${venueId}-${showtimeId}-seats`);
    const rng = this.seededRandom(seed);

    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let rowIndex = 0;

    return pricing.sections.map((section) => ({
      name: section.name,
      price: `₹${section.price}`,
      rows: Array.from({ length: section.rows }, () => {
        const label = rowLabels[rowIndex++] || `R${rowIndex}`;
        return {
          label,
          seats: Array.from({ length: section.seatsPerRow }, (_, i) => {
            const colNum = i + 1;
            const isAisle = section.aisles.includes(colNum);
            const isBooked = !isAisle && rng() < 0.18; // ~18% pre-booked
            return {
              id: `${label}${colNum}`,
              label: `${colNum}`,
              row: label,
              available: !isBooked && !isAisle,
              isAisle,
              booked: isBooked,
            };
          }),
        };
      }),
    }));
  }

  /**
   * Get available dates (today + next 6 days).
   */
  getAvailableDates() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        value: d.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
      });
    }
    return dates;
  }

  // --- Utility methods ---

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  timeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
}

export default new VenueService();
