import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { BottomNavigation } from './components/BottomNavigation.js';
import { SearchMarket } from './components/SearchMarket.js';
import { AuthModal } from './components/AuthModal.js';
import { AIChatModal } from './components/AIChatModal.js';
import { HomePage } from './pages/HomePage.js';
import { AssetDetailPage } from './pages/AssetDetailPage.js';
import { ScreenerPage } from './pages/ScreenerPage.js';
import { WatchlistPage } from './pages/WatchlistPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { RiskPage } from './pages/RiskPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';
import { apiClient } from './services/apiClient.js';
import { socketService } from './services/socketClient.js';
import { MarketsResponse, DisplayCurrency, CurrencyRates, MarketQuote } from './types/market.js';
import { Bell, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [marketsData, setMarketsData] = useState<MarketsResponse | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState<boolean>(true);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('USD');
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatSymbol, setChatSymbol] = useState('BTCUSDT');

  // Triggered alert toast
  const [triggeredToast, setTriggeredToast] = useState<any | null>(null);

  // Load initial data
  const loadMarkets = async () => {
    setLoadingMarkets(true);
    try {
      const data = await apiClient.getMarkets();
      setMarketsData(data);
    } catch (err: any) {
      console.warn('Failed to load markets:', err.message);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const loadCurrencyRates = async () => {
    try {
      const r = await apiClient.getCurrencyRates();
      setRates(r);
    } catch {}
  };

  const loadWatchlist = async () => {
    try {
      const wl = await apiClient.getWatchlist();
      setWatchlistItems(wl.items || []);
    } catch {}
  };

  const loadAlerts = async () => {
    try {
      const al = await apiClient.getAlerts();
      setAlerts(al || []);
    } catch {}
  };

  useEffect(() => {
    // Check saved user
    const savedUser = localStorage.getItem('tv_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }

    const savedCurr = localStorage.getItem('tv_currency') as DisplayCurrency;
    if (savedCurr) setDisplayCurrency(savedCurr);

    loadMarkets();
    loadCurrencyRates();
    loadWatchlist();
    loadAlerts();

    // Listen for real-time alert triggers from backend WebSocket
    const unsubAlerts = socketService.onAlert((alertData: any) => {
      setTriggeredToast(alertData);
      loadAlerts();
      setTimeout(() => setTriggeredToast(null), 6000);
    });

    return () => {
      unsubAlerts();
    };
  }, []);

  const handleCurrencyChange = (curr: DisplayCurrency) => {
    setDisplayCurrency(curr);
    localStorage.setItem('tv_currency', curr);
  };

  const handleSelectAsset = (sym: string) => {
    setSelectedSymbol(sym);
    setCurrentTab('chart');
  };

  const handleAddToWatchlist = async (sym: string) => {
    try {
      await apiClient.addToWatchlist(sym);
      await loadWatchlist();
    } catch {}
  };

  const handleRemoveFromWatchlist = async (sym: string) => {
    try {
      await apiClient.removeFromWatchlist(sym);
      await loadWatchlist();
    } catch {}
  };

  const handleCreateAlert = async (sym: string, condition: string, targetValue: number) => {
    try {
      await apiClient.createAlert(sym, condition, targetValue);
      await loadAlerts();
    } catch {}
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await apiClient.deleteAlert(id);
      await loadAlerts();
    } catch {}
  };

  const handleOpenAIChat = (sym: string = selectedSymbol) => {
    setChatSymbol(sym);
    setIsAIChatOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tv_token');
    localStorage.removeItem('tv_user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Alert Notification */}
      {triggeredToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Bell size={20} className="animate-bounce" />
          <div>
            <div className="font-bold text-xs">PRICE ALERT TRIGGERED!</div>
            <div className="text-xs opacity-95">
              {triggeredToast.symbol} reached target level {triggeredToast.targetValue}! Current: {triggeredToast.currentPrice}
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        displayCurrency={displayCurrency}
        onCurrencyChange={handleCurrencyChange}
        user={user}
        onLogout={handleLogout}
        alertsCount={alerts.filter((a) => !a.isTriggered).length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'home' && (
          <HomePage
            marketsData={marketsData}
            loading={loadingMarkets}
            onRefresh={loadMarkets}
            onSelectAsset={handleSelectAsset}
            onNavigatePortfolio={() => setCurrentTab('portfolio')}
            displayCurrency={displayCurrency}
            rates={rates}
            onOpenAIChat={handleOpenAIChat}
          />
        )}

        {currentTab === 'chart' && (
          <AssetDetailPage
            symbol={selectedSymbol}
            onBack={() => setCurrentTab('home')}
            displayCurrency={displayCurrency}
            rates={rates}
            onAddToWatchlist={handleAddToWatchlist}
            onOpenAlertModal={(sym) => {
              setSelectedSymbol(sym);
              setCurrentTab('alerts');
            }}
          />
        )}

        {currentTab === 'screener' && (
          <ScreenerPage
            markets={marketsData?.markets || []}
            onSelectAsset={handleSelectAsset}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        )}

        {currentTab === 'watchlist' && (
          <WatchlistPage
            watchlistItems={watchlistItems}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectAsset={handleSelectAsset}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            defaultSymbol={selectedSymbol}
          />
        )}

        {currentTab === 'portfolio' && (
          <PortfolioPage
            onSelectAsset={handleSelectAsset}
            displayCurrency={displayCurrency}
            rates={rates}
            allMarkets={marketsData?.markets || []}
          />
        )}

        {currentTab === 'risk' && <RiskPage />}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAIChat={() => handleOpenAIChat(selectedSymbol)}
      />

      {/* Search Modal */}
      <SearchMarket
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        markets={marketsData?.markets || []}
        onSelectAsset={handleSelectAsset}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          loadWatchlist();
          loadAlerts();
        }}
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        symbol={chatSymbol}
      />
    </div>
  );
};

export default App;
