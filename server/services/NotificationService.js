import logger from '../utils/logger.js';

class NotificationService {
  /**
   * Send notification when hold is about to expire.
   * Stub — integrate with email/SMS provider in Phase 2.
   */
  async sendHoldExpiryWarning(userId, reservation) {
    logger.info('Hold expiry warning', {
      userId,
      reservationId: reservation.id,
      expiresAt: reservation.hold_expiry,
    });
    // TODO: Integrate with email/SMS service
  }

  /**
   * Send notification when hold fails.
   */
  async sendHoldFailure(userId, reservation, reason) {
    logger.warn('Hold failure notification', {
      userId,
      reservationId: reservation.id,
      reason,
    });
    // TODO: Integrate with email/SMS service
  }

  /**
   * Send notification on successful confirmation.
   */
  async sendConfirmation(userId, reservation) {
    logger.info('Booking confirmation', {
      userId,
      reservationId: reservation.id,
      seats: reservation.seats,
    });
    // TODO: Integrate with email/SMS service
  }
}

export default new NotificationService();
