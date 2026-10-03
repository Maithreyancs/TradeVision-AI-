import { io, Socket } from 'socket.io-client';
import { MarketQuote } from '../types/market.js';

class SocketService {
  private socket: Socket | null = null;
  private tickerListeners = new Map<string, Set<(quote: MarketQuote) => void>>();
  private alertListeners = new Set<(alert: any) => void>();

  public connect() {
    if (this.socket && this.socket.connected) return;

    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      // Re-subscribe to any active tickers on reconnection
      for (const symbol of this.tickerListeners.keys()) {
        this.socket?.emit('subscribe_ticker', symbol);
      }
    });

    this.socket.on('ticker_update', (quote: MarketQuote) => {
      if (!quote || !quote.symbol) return;
      const listeners = this.tickerListeners.get(quote.symbol);
      if (listeners) {
        listeners.forEach((callback) => callback(quote));
      }
    });

    this.socket.on('alert_triggered', (alertData: any) => {
      this.alertListeners.forEach((callback) => callback(alertData));
    });
  }

  public subscribeTicker(symbol: string, callback: (quote: MarketQuote) => void): () => void {
    const cleanSymbol = symbol.trim().toUpperCase();
    this.connect();

    if (!this.tickerListeners.has(cleanSymbol)) {
      this.tickerListeners.set(cleanSymbol, new Set());
      this.socket?.emit('subscribe_ticker', cleanSymbol);
    }

    this.tickerListeners.get(cleanSymbol)!.add(callback);

    return () => {
      const set = this.tickerListeners.get(cleanSymbol);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.tickerListeners.delete(cleanSymbol);
          this.socket?.emit('unsubscribe_ticker', cleanSymbol);
        }
      }
    };
  }

  public onAlert(callback: (alertData: any) => void): () => void {
    this.connect();
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }
}

export const socketService = new SocketService();
