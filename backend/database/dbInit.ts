import prisma from './prismaClient.js';

export const INITIAL_ASSETS = [
  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin', assetClass: 'crypto', baseCurrency: 'BTC', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', assetClass: 'crypto', baseCurrency: 'ETH', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: true },
  { symbol: 'SOLUSDT', name: 'Solana', assetClass: 'crypto', baseCurrency: 'SOL', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: true },
  { symbol: 'BNBUSDT', name: 'BNB', assetClass: 'crypto', baseCurrency: 'BNB', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: false },
  { symbol: 'XRPUSDT', name: 'XRP', assetClass: 'crypto', baseCurrency: 'XRP', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: false },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', assetClass: 'crypto', baseCurrency: 'DOGE', quoteCurrency: 'USDT', exchange: 'Binance', isPopular: false },

  // Indian Stocks
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', assetClass: 'indian_stocks', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: true },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', assetClass: 'indian_stocks', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: true },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', assetClass: 'indian_stocks', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: true },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', assetClass: 'indian_stocks', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: false },
  { symbol: 'SBIN.NS', name: 'State Bank of India', assetClass: 'indian_stocks', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: false },

  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'us_stocks', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'us_stocks', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'us_stocks', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'us_stocks', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'us_stocks', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: false },

  // Indices
  { symbol: '^NSEI', name: 'NIFTY 50', assetClass: 'indices', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: true },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', assetClass: 'indices', baseCurrency: 'INR', quoteCurrency: 'INR', exchange: 'NSE', isPopular: true },
  { symbol: '^GSPC', name: 'S&P 500', assetClass: 'indices', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'CBOE', isPopular: true },
  { symbol: '^IXIC', name: 'NASDAQ Composite', assetClass: 'indices', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NASDAQ', isPopular: false },

  // Commodities / Gold
  { symbol: 'GC=F', name: 'Gold Futures (XAU/USD)', assetClass: 'commodities', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'COMEX', isPopular: true },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', assetClass: 'commodities', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'NYMEX', isPopular: false },
  { symbol: 'SI=F', name: 'Silver Futures', assetClass: 'commodities', baseCurrency: 'USD', quoteCurrency: 'USD', exchange: 'COMEX', isPopular: false },

  // Forex
  { symbol: 'EURUSD=X', name: 'EUR / USD', assetClass: 'forex', baseCurrency: 'EUR', quoteCurrency: 'USD', exchange: 'FX', isPopular: true },
  { symbol: 'GBPUSD=X', name: 'GBP / USD', assetClass: 'forex', baseCurrency: 'GBP', quoteCurrency: 'USD', exchange: 'FX', isPopular: false },
  { symbol: 'USDINR=X', name: 'USD / INR', assetClass: 'forex', baseCurrency: 'USD', quoteCurrency: 'INR', exchange: 'FX', isPopular: true },
  { symbol: 'USDJPY=X', name: 'USD / JPY', assetClass: 'forex', baseCurrency: 'USD', quoteCurrency: 'JPY', exchange: 'FX', isPopular: false },
];

export async function initializeDatabase() {
  try {
    for (const item of INITIAL_ASSETS) {
      await prisma.asset.upsert({
        where: { symbol: item.symbol },
        update: {
          name: item.name,
          assetClass: item.assetClass,
          exchange: item.exchange,
          isPopular: item.isPopular,
        },
        create: item,
      });
    }

    // Ensure default watchlist exists
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: { isDefault: true },
    });

    if (!defaultWatchlist) {
      const created = await prisma.watchlist.create({
        data: {
          name: 'Core Watchlist',
          isDefault: true,
        },
      });

      const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', '^NSEI', 'AAPL', 'GC=F', 'RELIANCE.NS'];
      for (let i = 0; i < defaultSymbols.length; i++) {
        await prisma.watchlistItem.create({
          data: {
            watchlistId: created.id,
            symbol: defaultSymbols[i],
            displayOrder: i,
          },
        });
      }
    }

    console.log('✅ Database initialized with standard multi-asset catalog and default watchlist');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
