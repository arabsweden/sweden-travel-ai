import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  ShieldAlert, 
  Zap, 
  MessageSquare, 
  Globe, 
  Search, 
  ArrowRight,
  LogIn,
  LogOut,
  Building2,
  PhoneCall
} from 'lucide-react';
import { Language, SearchResult } from './types';
import { TRANSLATIONS, STATIC_CITIES, STATIC_ATTRACTIONS } from './constants';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange, 
  getCachedToken, 
  clearCachedToken 
} from './firebase';

// Modular UI Screen Imports
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import PlannerView from './components/PlannerView';
import ExploreView from './components/ExploreView';
import AssistantView from './components/AssistantView';
import GuideView from './components/GuideView';
import EmergencyView from './components/EmergencyView';
import BudgetView from './components/BudgetView';
import DashboardView from './components/DashboardView';
import ChecklistView from './components/ChecklistView';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewSubParam, setViewSubParam] = useState<any>(null);
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Retrieve access token
        const token = getCachedToken();
        setAccessToken(token);
      } else {
        setAccessToken(null);
        clearCachedToken();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Live Global Search Matching Cities & Attractions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Match Cities
    STATIC_CITIES.forEach((city) => {
      if (city.name.toLowerCase().includes(query) || city.description.toLowerCase().includes(query)) {
        results.push({
          id: city.id,
          name: city.name,
          type: 'city',
          description: city.description,
          image: city.image
        });
      }
    });

    // Match Attractions
    STATIC_ATTRACTIONS.forEach((attr) => {
      if (attr.name.toLowerCase().includes(query) || attr.description.toLowerCase().includes(query)) {
        results.push({
          id: attr.id,
          name: attr.name,
          type: 'attraction',
          description: attr.description,
          image: attr.image
        });
      }
    });

    setSearchResults(results);
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    if (result.type === 'city') {
      setCurrentView('attractions'); // Switch to attractions/cities explorer
      setViewSubParam('cities');
    } else {
      setCurrentView('attractions');
      setViewSubParam('attractions');
    }
  };

  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  return (
    <div className="min-h-screen bg-scandi-light flex flex-col font-sans antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header & Language Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Slogan */}
          <button 
            onClick={() => { setCurrentView('home'); setSearchQuery(''); }}
            className="flex items-center gap-2.5 text-slate-900 hover:opacity-95 transition-opacity cursor-pointer"
            id="brand-logo-btn"
          >
            <span className="text-2xl">🇸🇪</span>
            <div className="text-left font-sans">
              <span className="font-extrabold text-sm tracking-tight block text-scandi-blue">SWEDEN TRAVEL AI</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Smart Guide</span>
            </div>
          </button>

          {/* Quick Nav & Language Toggles */}
          <div className="flex items-center gap-4">
            {/* Quick Emergency Button */}
            <button
              onClick={() => setCurrentView('emergency')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all border border-red-100 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              112 Emergency
            </button>

            {/* Language Switchers */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'en' ? 'bg-scandi-blue text-white' : 'text-slate-600 hover:text-scandi-blue'
                }`}
                id="lang-en-btn"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'ar' ? 'bg-scandi-blue text-white' : 'text-slate-600 hover:text-scandi-blue'
                }`}
                id="lang-ar-btn"
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('sv')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'sv' ? 'bg-scandi-blue text-white' : 'text-slate-600 hover:text-scandi-blue'
                }`}
                id="lang-sv-btn"
              >
                SV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Render Search Results overlay if query exists */}
        {searchQuery.trim() && (
          <div className="absolute inset-x-4 sm:inset-x-8 top-4 bg-white/95 border border-slate-200 rounded-2xl shadow-xl z-50 p-6 backdrop-blur-md max-w-2xl mx-auto space-y-4 animate-fade-in text-xs text-slate-700">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Search Sweden Guide ({searchResults.length} matches)
            </h3>
            
            {searchResults.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No locations or guides match "{searchQuery}"</p>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-center gap-3.5 cursor-pointer"
                  >
                    <img src={result.image} alt={result.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{result.name}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold block uppercase tracking-wider">{result.type}</span>
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{result.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Route Router */}
        {currentView === 'home' && (
          <HomeView 
            language={language}
            onNavigate={(view) => setCurrentView(view)}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentView === 'chat' && (
          <ChatView 
            language={language}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'planner' && (
          <PlannerView 
            language={language}
            onBack={() => setCurrentView('home')}
            user={user}
            accessToken={accessToken}
            onLogin={handleLogin}
          />
        )}

        {currentView === 'attractions' && (
          <ExploreView 
            language={language}
            defaultView={viewSubParam || 'cities'}
            onBack={() => { setCurrentView('home'); setViewSubParam(null); }}
            user={user}
          />
        )}

        {(currentView === 'hotels' || currentView === 'flights') && (
          <AssistantView 
            language={language}
            defaultMode={currentView as any}
            onBack={() => setCurrentView('home')}
          />
        )}

        {(currentView === 'weather' || currentView === 'events' || currentView === 'shopping' || currentView === 'family' || currentView === 'nature' || currentView === 'cruises' || currentView === 'muslim') && (
          <GuideView 
            language={language}
            defaultGuide={
              currentView === 'muslim' ? 'muslim' :
              currentView === 'weather' ? 'weather' :
              currentView === 'shopping' ? 'shopping' :
              currentView === 'cruises' ? 'cruises' :
              'allemansratten'
            }
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'emergency' && (
          <EmergencyView 
            language={language}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'checklist' && (
          <ChecklistView 
            language={language}
            onBack={() => setCurrentView('home')}
            user={user}
            onLogin={handleLogin}
          />
        )}

        {currentView === 'budget' && (
          <BudgetView 
            language={language}
            user={user}
            onBack={() => setCurrentView('home')}
            onLogin={handleLogin}
          />
        )}

        {currentView === 'admin' && (
          <DashboardView 
            language={language}
            user={user}
            onBack={() => setCurrentView('home')}
          />
        )}
      </main>

      {/* Footer / Credits */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🇸🇪</span>
            <span className="font-extrabold text-sm text-slate-200">Sweden Travel AI</span>
          </div>
          <p className="text-[11px] text-slate-500">
            © 2026 Sweden Travel AI. Built for tourists, business travelers, and families. Support: Raedinsweden@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}
