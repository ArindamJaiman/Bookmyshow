import { WebSocketServer } from 'ws';
import { supabase } from '../db/supabase.js';
import seatHoldService from '../services/SeatHoldService.js';
import logger from '../utils/logger.js';

/**
 * Setup WebSocket server for real-time seat status updates.
 */
export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Map<userId, Set<WebSocket>>
  const userConnections = new Map();

  wss.on('connection', async (ws, req) => {
    // Extract token from query params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify token
    let userId;
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('Invalid token');
      userId = user.id;
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
      ws.close(1008, 'Invalid token');
      return;
    }

    logger.info('WebSocket connected', { userId });

    // Track connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(ws);

    // Send current holds status
    const { data: activeHolds } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'holding')
      .gt('hold_expiry', new Date().toISOString());

    if (activeHolds) {
      for (const hold of activeHolds) {
        const liveStatus = hold.browser_session_id
          ? seatHoldService.getStatus(hold.browser_session_id)
          : null;

        ws.send(
          JSON.stringify({
            type: 'hold:status',
            data: {
              reservationId: hold.id,
              status: hold.status,
              seats: hold.seats,
              timeRemaining: Math.max(0, new Date(hold.hold_expiry) - Date.now()),
              liveStatus,
            },
          })
        );

        // Register event listener for this hold
        if (hold.browser_session_id) {
          seatHoldService.onEvent(hold.browser_session_id, (event, data) => {
            broadcastToUser(userId, { type: event, data: { ...data, reservationId: hold.id } });
          });
        }
      }
    }

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        handleMessage(userId, parsed, ws);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      logger.info('WebSocket disconnected', { userId });
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });

    ws.send(JSON.stringify({ type: 'connected', data: { userId } }));
  });

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  /**
   * Broadcast message to all connections of a user.
   */
  function broadcastToUser(userId, message) {
    const connections = userConnections.get(userId);
    if (!connections) return;

    const payload = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages.
   */
  function handleMessage(userId, message, ws) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'hold:status':
        if (message.sessionId) {
          const status = seatHoldService.getStatus(message.sessionId);
          ws.send(JSON.stringify({ type: 'hold:status', data: status }));
        }
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
    }
  }

  logger.info('WebSocket server initialized');
  return wss;
}
