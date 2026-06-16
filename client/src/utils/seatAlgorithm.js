/**
 * Finds the optimal contiguous block of seats in a cinema layout.
 * The acoustic and visual sweet spot is typically ~66% back from the screen,
 * and perfectly centered horizontally.
 * 
 * @param {Array} layout - The seat layout array of sections
 * @param {number} numSeats - Number of contiguous seats to find
 * @param {Set} unavailableSet - Set of seat IDs that are booked or held
 * @returns {Array} - Array of optimal seat IDs
 */
export function findBestSeats(layout, numSeats = 2, unavailableSet = new Set()) {
  if (!layout || layout.length === 0) return [];

  const allAvailableSeats = [];
  let maxRowIndex = 0;
  let maxColIndex = 0;

  // Flatten layout and find dimensions to calculate center
  let currentRowIndex = 0;
  layout.forEach(section => {
    section.rows.forEach(row => {
      row.seats.forEach((seat, colIndex) => {
        if (!seat.isAisle) {
          maxColIndex = Math.max(maxColIndex, colIndex);
          if (seat.available && !seat.booked && !unavailableSet.has(seat.id)) {
            allAvailableSeats.push({
              ...seat,
              rIdx: currentRowIndex,
              cIdx: colIndex
            });
          }
        }
      });
      currentRowIndex++;
    });
  });

  maxRowIndex = currentRowIndex - 1;

  if (allAvailableSeats.length === 0) return [];

  // Sweet spot coordinates
  // Vertical: ~66% from the front (screen is at rIdx 0)
  const targetRow = maxRowIndex * 0.66;
  // Horizontal: Center of the row
  const targetCol = maxColIndex / 2;

  let bestScore = Infinity;
  let bestSeats = [];

  // Group available seats by row to find contiguous blocks
  const rowMap = new Map();
  allAvailableSeats.forEach(seat => {
    if (!rowMap.has(seat.row)) rowMap.set(seat.row, []);
    rowMap.get(seat.row).push(seat);
  });

  // Evaluate every possible contiguous block of size `numSeats`
  for (const [rowLabel, seatsInRow] of rowMap.entries()) {
    // Sort seats by column index to ensure they are ordered
    seatsInRow.sort((a, b) => a.cIdx - b.cIdx);

    for (let i = 0; i <= seatsInRow.length - numSeats; i++) {
      const block = seatsInRow.slice(i, i + numSeats);
      
      // Check if the block is truly contiguous (no gaps/aisles between them)
      let isContiguous = true;
      for (let j = 0; j < block.length - 1; j++) {
        // Assuming labels or cIdx can determine adjacency.
        // If there's an aisle, cIdx difference might be > 1.
        if (block[j+1].cIdx - block[j].cIdx !== 1) {
          isContiguous = false;
          break;
        }
      }

      if (!isContiguous) continue;

      // Calculate score for the block (average distance to sweet spot)
      let totalDistance = 0;
      block.forEach(seat => {
        const rowDist = Math.abs(seat.rIdx - targetRow);
        const colDist = Math.abs(seat.cIdx - targetCol);
        // Euclidean distance, weighting horizontal centering slightly more
        const dist = Math.sqrt(Math.pow(rowDist, 2) + Math.pow(colDist * 1.5, 2));
        totalDistance += dist;
      });

      const avgDistance = totalDistance / numSeats;

      if (avgDistance < bestScore) {
        bestScore = avgDistance;
        bestSeats = block.map(s => s.id);
      }
    }
  }

  // Fallback if no contiguous block is found: just return the top N best individual seats
  if (bestSeats.length === 0 && allAvailableSeats.length > 0) {
    allAvailableSeats.forEach(seat => {
      const rowDist = Math.abs(seat.rIdx - targetRow);
      const colDist = Math.abs(seat.cIdx - targetCol);
      seat.score = Math.sqrt(Math.pow(rowDist, 2) + Math.pow(colDist * 1.5, 2));
    });
    
    allAvailableSeats.sort((a, b) => a.score - b.score);
    bestSeats = allAvailableSeats.slice(0, Math.min(numSeats, allAvailableSeats.length)).map(s => s.id);
  }

  return bestSeats;
}
