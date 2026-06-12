import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';
import proxyRotator from '../utils/proxyRotator.js';

class ShowParserService {
  /**
   * Parse a BookMyShow URL to extract show details.
   * Uses Puppeteer to scrape the page and extract info.
   */
  async parseShowUrl(url) {
    logger.info('Parsing show URL', { url });

    // Validate URL format
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid BookMyShow URL format');
    }

    let browser;
    try {
      const launchOpts = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      };

      const proxy = proxyRotator.getNext();
      if (proxy) {
        launchOpts.args.push(`--proxy-server=${proxy}`);
      }

      browser = await puppeteer.launch(launchOpts);
      const page = await browser.newPage();

      await page.setUserAgent(config.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract show details from the page
      const showDetails = await page.evaluate(() => {
        // These selectors target BookMyShow's typical page structure
        // They may need updates if BookMyShow changes their DOM
        const getText = (selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return '';
        };

        return {
          movieName: getText([
            'h1.cinema-name-wrapper',
            '[data-testid="movie-name"]',
            '.cinema-name',
            'h1',
            '.styles_eventHeading__AOjnb',
          ]),
          venue: getText([
            '.styles_venueDetails__1VZwS',
            '[data-testid="venue-name"]',
            '.venue-name',
            '.cinema-hall-name',
          ]),
          showDate: getText([
            '.styles_showDate__2L2wB',
            '[data-testid="show-date"]',
            '.date-details',
          ]),
          showTime: getText([
            '.styles_showTime__1bPdM',
            '[data-testid="show-time"]',
            '.show-time',
          ]),
          language: getText(['.styles_language__3-Tsy', '.language']),
          format: getText(['.styles_format__3GROO', '.dimension']),
        };
      });

      logger.info('Show details parsed', { showDetails });

      return {
        ...showDetails,
        url,
        parsedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to parse show URL', { url, error: error.message });
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Extract seat layout from the BookMyShow seat selection page.
   */
  async getSeatLayout(url) {
    logger.info('Fetching seat layout', { url });

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(config.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for seat layout to load
      await page.waitForSelector('.seat-layout, .seatlayout, [data-testid="seat-layout"]', {
        timeout: 15000,
      }).catch(() => {
        logger.warn('Seat layout selector not found, using fallback');
      });

      // Extract seat layout
      const layout = await page.evaluate(() => {
        const sections = [];
        const seatContainers = document.querySelectorAll(
          '.seat-layout-container, .seatlayout, .layout-section'
        );

        if (seatContainers.length === 0) {
          // Generate a demo layout if we can't scrape
          return null;
        }

        seatContainers.forEach((container) => {
          const sectionName =
            container.querySelector('.section-name, .category-name')?.textContent?.trim() || 'Standard';
          const price =
            container.querySelector('.price, .category-price')?.textContent?.trim() || '₹0';

          const rows = [];
          container.querySelectorAll('.seat-row, tr').forEach((row) => {
            const rowLabel = row.querySelector('.row-label, td:first-child')?.textContent?.trim() || '';
            const seats = [];

            row.querySelectorAll('.seat, .seat-cell').forEach((seat) => {
              const seatNum = seat.textContent?.trim() || '';
              const isAvailable = !seat.classList.contains('booked') && !seat.classList.contains('sold');
              const isAisle = seat.classList.contains('aisle') || seat.classList.contains('gap');

              if (seatNum || isAisle) {
                seats.push({
                  id: `${rowLabel}${seatNum}`,
                  label: seatNum,
                  row: rowLabel,
                  available: isAvailable,
                  isAisle,
                });
              }
            });

            if (seats.length > 0) {
              rows.push({ label: rowLabel, seats });
            }
          });

          sections.push({ name: sectionName, price, rows });
        });

        return sections;
      });

      // If scraping failed, generate a demo layout
      if (!layout || layout.length === 0) {
        return this.generateDemoLayout();
      }

      return layout;
    } catch (error) {
      logger.error('Failed to get seat layout', { url, error: error.message });
      // Return demo layout on failure
      return this.generateDemoLayout();
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Generate a realistic demo seat layout for development/demo
   */
  generateDemoLayout() {
    const categories = [
      {
        name: 'PLATINUM RECLINER',
        price: '₹400',
        rows: ['A', 'B'],
        seatsPerRow: 10,
        startCol: 1,
        aisles: [4, 7],
      },
      {
        name: 'GOLD',
        price: '₹280',
        rows: ['C', 'D', 'E', 'F', 'G'],
        seatsPerRow: 16,
        startCol: 1,
        aisles: [4, 13],
      },
      {
        name: 'SILVER',
        price: '₹150',
        rows: ['H', 'I', 'J', 'K', 'L', 'M'],
        seatsPerRow: 20,
        startCol: 1,
        aisles: [5, 16],
      },
    ];

    return categories.map((cat) => ({
      name: cat.name,
      price: cat.price,
      rows: cat.rows.map((rowLabel) => ({
        label: rowLabel,
        seats: Array.from({ length: cat.seatsPerRow }, (_, i) => {
          const colNum = cat.startCol + i;
          const isAisle = cat.aisles.includes(colNum);
          // Randomly mark ~15% as booked for realism
          const isBooked = Math.random() < 0.15;
          return {
            id: `${rowLabel}${colNum}`,
            label: `${colNum}`,
            row: rowLabel,
            available: !isBooked && !isAisle,
            isAisle,
            booked: isBooked,
          };
        }),
      })),
    }));
  }

  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('bookmyshow.com');
    } catch {
      return false;
    }
  }
}

export default new ShowParserService();
