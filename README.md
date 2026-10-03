# TradeVision AI — Institutional Real-Time Market Intelligence Platform

![TradeVision AI](https://img.shields.io/badge/Platform-TradeVision%20AI-06B6D4?style=for-the-badge)
![Market Data](https://img.shields.io/badge/Market%20Data-100%25%20Real%20Data-10B981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**TradeVision AI** is a production-quality, full-stack trading and quantitative market analysis platform engineered for active traders, analysts, and institutional-grade charting. The platform operates exclusively on **real-time live market data** streaming from legitimate market providers across multiple asset classes:
- **Cryptocurrencies** (BTC, ETH, SOL, BNB, XRP, DOGE via Binance WebSocket & REST)
- **Indian Equities** (Reliance, TCS, Infosys, HDFC Bank, SBI via NSE)
- **US Equities** (Apple, Tesla, NVIDIA, Microsoft, Amazon via NASDAQ/NYSE)
- **Global Indices** (NIFTY 50, BANK NIFTY, S&P 500, NASDAQ Composite, Dow Jones)
- **Gold & Commodities** (Gold Futures XAU/USD, Silver, Crude Oil WTI)
- **Forex** (EUR/USD, GBP/USD, USD/INR, USD/JPY)

---

## 🚀 Key Capabilities

### 1. 100% Real Market Data Service Layer
- **No Simulated or Random Prices:** Every quote, candle, volume, and percentage change is derived from real market trades.
- **Provider-Independent Abstraction (`IMarketDataProvider`):** Dedicated service layer with `BinanceProvider`, `YahooFinanceProvider`, and `ProviderRegistry`.
- **Ultra-low latency streaming:** Native WebSocket feeds for live ticks, order book updates, and alert triggers.
- **Data Integrity & Fallback:** Stale-data detection, duplicate candle protection, and `"Market data temporarily unavailable"` handling when external exchanges fail.

### 2. High-Performance Trading Charts & Drawing Suite
- **TradingView Lightweight Charts Engine:** Candlestick, Line, and Area representations across 9 timeframes (`1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`, `1M`).
- **Full Drawing Toolkit:**
  - Trend Lines & Extended Rays
  - Horizontal & Vertical Time Lines
  - Dedicated Support & Resistance Level Markers
  - Fibonacci Retracement & Fibonacci Extensions (23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%, 161.8%)
  - Geometric Rectangles & Parallel Channels
  - Price Range & Bar Measure Tool
  - Move/Drag, Resize, Undo, Redo, Delete, Clear All, and Database Persistence across sessions.

### 3. Quantitative Technical Analysis & Indicators
- **Moving Averages:** SMA 20, SMA 50, SMA 100, SMA 200, EMA 9, EMA 20, EMA 50.
- **Momentum:** Relative Strength Index (RSI 14), MACD (12, 26, 9 with Histogram & Bullish/Bearish Crossover detection), Stochastic RSI.
- **Volatility:** Bollinger Bands (20, 2 std dev), Average True Range (ATR 14).
- **Volume:** Dynamic 20-period moving average volume ratio, Volume Spikes, and Volume-Weighted Average Price (VWAP).
- **Trend Strength:** Average Directional Index (ADX 14 with +DI / -DI and strength tiers).

### 4. Algorithmic Support & Resistance Detection
- Identifies swing highs and swing lows using rolling price clustering (0.8% threshold) and floor pivot points.
- Automatically calculates and tags **S1, S2, S3** (Support levels) and **R1, R2, R3** (Resistance levels).
- Evaluates **strength (1-10)**, historical touch count, and exact percentage distance from the current live price.

### 5. Multi-Factor Trend Detection Engine
- Classifies current market condition into **BULLISH**, **BEARISH**, or **SIDEWAYS**.
- Transparent scoring system:
  - `+2.0 / -2.0`: EMA Ribbon Trend (Price vs EMA 20 vs EMA 50)
  - `+1.5 / -1.5`: MACD Crossover and Histogram Expansion
  - `+1.5 / -1.5`: Long-Term Golden Cross / Death Cross (SMA 50 vs SMA 200)
  - `+1.0 / -1.0`: RSI Momentum Confirmation
  - `+1.5 / -1.5`: Consecutive Higher Highs/Lows vs Lower Highs/Lows
  - `+1.0 / -1.0`: ADX Directional Conviction (>25)
- **Model Confidence Score:** Quantifies percentage agreement across all statistical signals.

### 6. Multi-Timeframe Analysis Matrix
- Evaluates `5m`, `15m`, `1h`, `4h`, `1d`, and `1w` simultaneously.
- Displays timeframe alignment, concordance rate (e.g. 83%), and flags conflicting signals or counter-trend pullbacks.

### 7. TradeVision AI Assistant & Natural Language Chat
- Synthesizes quantitative indicators and order levels into concise technical summaries.
- Interactive chat assistant answering live questions: *"What is the current BTC trend?"*, *"Where are the nearest support levels?"*, *"What indicators are bullish?"*.
- **Zero Hallucination Guarantee:** AI strictly references incoming numerical structured data.
- **Compliance Guardrail:** Adheres strictly to non-dogmatic probabilistic terms; never guarantees future prices.

### 8. Risk Management & Position Sizing Calculator
- Calculates exact maximum risk amount, recommended position size, potential reward, and risk/reward ratio based on account equity, risk allocation (%), entry price, and stop-loss level.
- Provides staged algorithmic take-profit milestones (Target 1 at 1:1.5 RR, Target 2 at 1:2.5 RR, Target 3 at 1:4.0 RR).

### 9. Multi-Currency Display
- Instant currency conversion across **USD**, **INR**, **EUR**, **GBP**, and **JPY** using real-time foreign exchange rates while preserving the underlying market quote currency.

### 10. Market Screener, Watchlists & Live Alert Push
- **Screener:** Filter by asset class, 24h gainers/losers, volume, and momentum.
- **Watchlist:** Save favorites across asset classes with database persistence.
- **Alerts:** Set triggers (Price Above / Price Below) and receive instant WebSocket push notifications with sound/banner.

### 11. Live Portfolio & Multi-Asset Wallet
- **Total Balance & Privacy Mode:** Large equity display with an Eye toggle to mask sensitive balances (`••••••••`) for screen sharing.
- **Real-Time Market Valuation:** Holdings are continuously revalued against incoming real live prices across Crypto, Indian Stocks, US Equities, and Commodities.
- **Today's P&L & All-Time Performance:** Automated calculation of daily and lifetime profit/loss amount and return percentages.
- **Deposit Virtual Funds:** Modal with quick preset increments (+$1,000, +$5,000, +$10,000, +$25,000) or custom amounts.
- **Direct Live Market Execution:** Buy and sell any supported instrument at authentic real-time market prices with balance checks and transaction logging.
- **Asset Allocation Visualizer:** Segmented distribution bar displaying percentage breakdown across Crypto, Indian Stocks, US Stocks, Commodities, and Cash.

### 12. Live Real-Time Candlestick Pattern Recognition & Price Action
- **Dynamic Candle Animation:** Sub-second candle updates that animate the current bar's open, high, low, and close in real time as market trades arrive without reloading history.
- **Pattern Detection Engine:** Algorithmic recognition of classic candlestick patterns on the active live bar:
  - *Hammer / Dragon Fly* (Bullish Rejection)
  - *Shooting Star / Gravestone* (Bearish Rejection)
  - *Bullish / Bearish Engulfing*
  - *Doji* (Indecision)
  - *Strong Bullish / Bearish Expansion*
- **Floating HUD Badge:** Displays live tick momentum (`▲ UP` / `▼ DOWN`) and current candlestick pattern label.

### 13. Full Screen Market View
- Right-aligned **Full Screen** toggle button on the chart toolbar.
- Expands the chart, drawing canvas, indicators, and live HUD into an immersive, distraction-free trading view.
- Supports instant exit via toolbar button or the `Esc` keyboard shortcut.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TradingView Lightweight Charts, Socket.IO Client.
- **Backend:** Node.js, Express, TypeScript, tsx, Socket.IO Server, WebSocket (`ws`).
- **Database:** PostgreSQL (production ready) / SQLite (zero-config local default), Prisma ORM.
- **APIs:** Binance WebSocket & Public REST API, Yahoo Finance Chart API, Frankfurter FX Exchange Rates. Optional: Google Gemini / OpenAI API for LLM reasoning.

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ (tested on Node v20 / v22 / v24)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/tradevision-ai.git
cd trade
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` settings (already configured for instant local execution):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=tradevision_super_secret_jwt_key_2025_prod_secure
MARKET_DATA_API_KEY=
AI_API_KEY=
```

### 3. Initialize Database
Initialize the Prisma schema:
```powershell
npx prisma generate; npx prisma db push
```

### 4. Run Locally
Start both backend (Port 5000) and frontend (Port 3000) with a single command:
```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🗄️ Database Architecture

Prisma models include:
- `User`: Authentication, email, bcrypt password hash.
- `Asset`: Multi-asset master catalog (symbol, name, assetClass, currencies, exchange).
- `Watchlist` & `WatchlistItem`: User-curated custom watchlists.
- `PriceAlert`: Real-time price threshold and indicator triggers.
- `ChartDrawing`: Coordinates, styles, and tools persisted per symbol and timeframe.
- `UserIndicatorSettings`: Custom indicator parameters per user.
- `MarketSnapshot`: Historical timestamped price snapshots.
- `AnalysisResult`: Algorithmic analysis outputs and trend scores.

### Switching to PostgreSQL in Production
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/tradevision?schema=public"
   ```
3. Run `npx prisma db push`.

---

## 🔌 API Endpoints Reference

### Markets & Tickers
- `GET /api/markets` — List all assets, hero cards, gainers, losers, most active.
- `GET /api/markets/:symbol` — Quote and market details for a single symbol.
- `GET /api/markets/:symbol/candles?timeframe=1h&limit=120` — Historical OHLCV candles.
- `GET /api/markets/:symbol/analysis` — Full quantitative trend analysis & multi-timeframe concordance.
- `GET /api/markets/:symbol/indicators` — Real-time technical indicator computation.
- `GET /api/markets/:symbol/support-resistance` — Dynamic S1-S3 and R1-R3 levels.
- `GET /api/markets/:symbol/trend` — Direction, trend score, and signal weights.

### Watchlists & Alerts
- `GET /api/watchlist` — Get active watchlist with live prices.
- `POST /api/watchlist` — Add symbol to watchlist.
- `DELETE /api/watchlist/:symbol` — Remove symbol from watchlist.
- `GET /api/alerts` — Fetch active and triggered price alerts.
- `POST /api/alerts` — Create price alert (`symbol`, `condition`, `targetValue`).
- `DELETE /api/alerts/:id` — Delete alert.

### AI & Chat
- `POST /api/ai/analyze` — Run algorithmic AI evaluation on symbol.
- `POST /api/ai/chat` — Context-aware AI chat strictly grounded in live market data.

### Currencies
- `GET /api/currencies/rates` — Live exchange rates for USD, INR, EUR, GBP, JPY.
- `GET /api/currencies/convert?amount=100&from=USD&to=INR` — Convert currency.

---

## ⚖️ Disclaimer

Market analysis and AI-generated signals provided by TradeVision AI are for informational and educational purposes only. They do not constitute financial, investment, or trading advice, and do not guarantee future market movements. Always conduct independent research and exercise prudent risk management.
