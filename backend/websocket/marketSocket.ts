import { Server as SocketIOServer } from 'socket.io';
import { providerRegistry } from '../providers/ProviderRegistry.js';
import { MarketQuote } from '../providers/MarketDataProvider.js';
import { AlertService } from '../services/alertService.js';

let ioInstance: SocketIOServer | null = null;
const clientSubscriptions = new Map<string, Set<string>>(); // socketId -> Set<symbol>
const symbolUnsubs = new Map<string, () => void>(); // symbol -> unsubscribe function
const symbolRefCounts = new Map<string, number>(); // symbol -> subscriber count

export function initWebSocketServer(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    clientSubscriptions.set(socket.id, new Set());

    socket.on('subscribe_ticker', (symbol: string) => {
      if (!symbol || typeof symbol !== 'string') return;
      const cleanSymbol = symbol.trim().toUpperCase();

      clientSubscriptions.get(socket.id)?.add(cleanSymbol);
      socket.join(`ticker:${cleanSymbol}`);

      // Increment reference count and subscribe to provider if first subscriber
      const currentCount = symbolRefCounts.get(cleanSymbol) || 0;
      symbolRefCounts.set(cleanSymbol, currentCount + 1);

      if (currentCount === 0) {
        const unsub = providerRegistry.subscribeTicker(cleanSymbol, (quote: MarketQuote) => {
          io.to(`ticker:${cleanSymbol}`).emit('ticker_update', quote);
          AlertService.checkAlertsForQuote(quote);
        });
        symbolUnsubs.set(cleanSymbol, unsub);
      } else {
        // Send immediate quote if available
        providerRegistry.getQuote(cleanSymbol).then((q) => {
          if (q) socket.emit('ticker_update', q);
        });
      }
    });

    socket.on('unsubscribe_ticker', (symbol: string) => {
      if (!symbol) return;
      const cleanSymbol = symbol.trim().toUpperCase();

      clientSubscriptions.get(socket.id)?.delete(cleanSymbol);
      socket.leave(`ticker:${cleanSymbol}`);

      const currentCount = symbolRefCounts.get(cleanSymbol) || 1;
      const newCount = Math.max(0, currentCount - 1);
      symbolRefCounts.set(cleanSymbol, newCount);

      if (newCount === 0) {
        const unsub = symbolUnsubs.get(cleanSymbol);
        if (unsub) {
          unsub();
          symbolUnsubs.delete(cleanSymbol);
        }
      }
    });

    socket.on('disconnect', () => {
      const subs = clientSubscriptions.get(socket.id);
      if (subs) {
        for (const symbol of subs) {
          const currentCount = symbolRefCounts.get(symbol) || 1;
          const newCount = Math.max(0, currentCount - 1);
          symbolRefCounts.set(symbol, newCount);

          if (newCount === 0) {
            const unsub = symbolUnsubs.get(symbol);
            if (unsub) {
              unsub();
              symbolUnsubs.delete(symbol);
            }
          }
        }
      }
      clientSubscriptions.delete(socket.id);
    });
  });
}

export function broadcastAlertTriggered(alertData: any) {
  if (ioInstance) {
    ioInstance.emit('alert_triggered', alertData);
  }
}
