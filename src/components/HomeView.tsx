import React from 'react';
import { 
  Compass, 
  Hotel, 
  Plane, 
  MapPin, 
  UtensilsCrossed, 
  Bus, 
  Calculator, 
  MessageSquare, 
  CloudSun, 
  CalendarDays, 
  ShoppingBag, 
  Users, 
  TreePine, 
  Ship, 
  FlameKindling, 
  ShieldAlert, 
  LogOut, 
  LogIn,
  Search,
  Mic,
  MicOff,
  Loader2,
  ClipboardCheck
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HomeViewProps {
  language: Language;
  onNavigate: (view: string, subParam?: any) => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const itemDetails: Record<string, { tag: string; bg: string; text: string; desc: string }> = {
  planner: { tag: 'Full Trip', bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700', desc: 'Generate a custom 7-day itinerary for your visit.' },
  hotels: { tag: 'Booking', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', desc: 'From ice hotels to boutique city apartments.' },
  flights: { tag: 'Transit', bg: 'bg-sky-50 text-sky-700', text: 'text-sky-700', desc: 'Compare and track routes to Swedish airports.' },
  attractions: { tag: 'Explore', bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', desc: 'Historic Gamla Stan, museums, and hidden gems.' },
  restaurants: { tag: 'Dining', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', desc: 'Swedish meatballs and top halal cuisines.' },
  transportation: { tag: 'Transit', bg: 'bg-cyan-50 text-cyan-700', text: 'text-cyan-700', desc: 'Master the SL metro, trains, and ferry routes.' },
  budget: { tag: 'Finance', bg: 'bg-teal-50 text-teal-700', text: 'text-teal-700', desc: 'Track your expenses in Swedish Krona (SEK).' },
  chat: { tag: 'AI Assist', bg: 'bg-violet-50 text-violet-700', text: 'text-violet-700', desc: 'Live Travel Concierge for localized inquiries.' },
  weather: { tag: 'Climate', bg: 'bg-orange-50 text-orange-700', text: 'text-orange-700', desc: 'Current conditions, seasonal forecasts, and packing guides.' },
  events: { tag: 'Cultural', bg: 'bg-pink-50 text-pink-700', text: 'text-pink-700', desc: 'Upcoming concerts, festivals, and exhibitions.' },
  shopping: { tag: 'Retail', bg: 'bg-purple-50 text-purple-700', text: 'text-purple-700', desc: 'Swedish design, local crafts, and top malls.' },
  family: { tag: 'Activities', bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', desc: 'Kid-friendly parks, museums, and theme parks.' },
  nature: { tag: 'Adventure', bg: 'bg-green-50 text-green-700', text: 'text-green-700', desc: 'Allemansrätten, national parks, and pristine hikes.' },
  cruises: { tag: 'Maritime', bg: 'bg-sky-50 text-sky-800', text: 'text-sky-800', desc: 'Exquisite archipelago and scenic Baltic cruises.' },
  muslim: { tag: 'Halal Guide', bg: 'bg-scandi-yellow text-scandi-dark', text: 'text-scandi-dark font-extrabold', desc: 'Mosques, halal dining, and local Muslim community tips.' },
  emergency: { tag: 'Assistance', bg: 'bg-red-50 text-red-700', text: 'text-red-700', desc: 'Immediate access to healthcare, police, and embassy contacts.' },
  checklist: { tag: 'Preparation', bg: 'bg-emerald-50 text-emerald-800', text: 'text-emerald-800 font-extrabold', desc: 'Sync travel dates & weather context to generate packing checklists and timeline tasks.' },
};

export default function HomeView({
  language,
  onNavigate,
  user,
  onLogin,
  onLogout,
  searchQuery,
  setSearchQuery
}: HomeViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [isListening, setIsListening] = React.useState(false);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [listeningStatus, setListeningStatus] = React.useState('');
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      if (language === 'ar') {
        recognition.lang = 'ar-SA';
      } else if (language === 'sv') {
        recognition.lang = 'sv-SE';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setListeningStatus(language === 'ar' ? 'جاري الاستماع... تحدّث الآن' : language === 'sv' ? 'Lyssnar... prata nu' : 'Listening... speak now');
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningStatus('');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setListeningStatus(language === 'ar' ? 'تم رفض إذن الميكروفون' : language === 'sv' ? 'Mikrofonåtkomst nekad' : 'Microphone permission denied');
        } else {
          setListeningStatus(language === 'ar' ? 'حدث خطأ في التعرف على الصوت' : language === 'sv' ? 'Ett fel uppstod' : 'Speech recognition error');
        }
        setTimeout(() => setListeningStatus(''), 3000);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [language, setSearchQuery]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const menuItems = [
    { id: 'planner', label: t.planTrip, icon: Compass },
    { id: 'hotels', label: t.hotels, icon: Hotel },
    { id: 'flights', label: t.flights, icon: Plane },
    { id: 'attractions', label: t.attractions, icon: MapPin },
    { id: 'restaurants', label: t.restaurants, icon: UtensilsCrossed },
    { id: 'transportation', label: t.transportation, icon: Bus },
    { id: 'budget', label: t.budget, icon: Calculator },
    { id: 'chat', label: t.chat, icon: MessageSquare },
    { id: 'weather', label: t.weather, icon: CloudSun },
    { id: 'events', label: t.events, icon: CalendarDays },
    { id: 'shopping', label: t.shopping, icon: ShoppingBag },
    { id: 'family', label: t.family, icon: Users },
    { id: 'nature', label: t.nature, icon: TreePine },
    { id: 'cruises', label: t.cruises, icon: Ship },
    { id: 'muslim', label: t.muslimGuide, icon: FlameKindling },
    { id: 'checklist', label: t.checklist || 'Trip Checklist', icon: ClipboardCheck },
    { id: 'emergency', label: t.emergency, icon: ShieldAlert },
  ];

  return (
    <div className={`space-y-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero / Header Panel with Scandi-Blue/Scandi-Dark Professional Polish Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-scandi-blue to-scandi-dark text-white p-8 md:p-12 shadow-xl border border-slate-800/10">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <span className="text-9xl">🇸🇪</span>
        </div>
        
        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl shadow-md">🇸🇪</span>
            <div className="px-3 py-1 bg-scandi-yellow text-scandi-dark rounded-full text-xs font-bold uppercase tracking-wider">
              {t.tagline}
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {t.appName}
          </h1>
          
          <p className="text-slate-200 text-sm md:text-base leading-relaxed">
            {t.subtitle}
          </p>

          {/* User Sign In State banner */}
          <div className="p-4 bg-scandi-dark/40 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-scandi-yellow" />
                ) : (
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-scandi-yellow font-bold border border-white/20">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-300">{t.welcomeBack},</div>
                  <div className="text-sm font-bold text-scandi-yellow">{user.displayName || user.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                {t.notLoggedIn}
              </p>
            )}

            <div>
              {user ? (
                <div className="flex items-center gap-2">
                  {user.email === "Raedinsweden@gmail.com" && (
                    <button 
                      onClick={() => onNavigate('admin')}
                      className="px-3 py-1.5 bg-scandi-yellow text-scandi-dark font-extrabold rounded-lg text-xs hover:bg-scandi-yellow/90 transition-all cursor-pointer"
                      id="admin-dashboard-btn"
                    >
                      {t.admin}
                    </button>
                  )}
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
                    id="signout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t.logout}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-scandi-yellow hover:bg-scandi-yellow/90 text-scandi-dark font-extrabold rounded-lg text-sm shadow-md transition-all cursor-pointer"
                  id="google-signin-btn"
                >
                  <LogIn className="w-4 h-4" />
                  {t.loginWithGoogle}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Unified Search Bar */}
      <div className="space-y-3 w-full">
        <div className="max-w-xl mx-auto relative w-full group">
          <div className={`absolute inset-y-0 ${isRtl ? 'right-3.5' : 'left-3.5'} flex items-center pointer-events-none z-10`}>
            <Search className="text-slate-400 w-5 h-5 group-focus-within:text-scandi-blue transition-colors" />
          </div>
          
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-3.5 ${isRtl ? 'pr-11 pl-11' : 'pl-11 pr-11'} rounded-xl border border-slate-250 shadow-xs focus:outline-none focus:ring-2 focus:ring-scandi-blue/50 focus:border-scandi-blue bg-white text-slate-800 text-sm transition-all`}
            id="global-search-input"
          />

          {speechSupported && (
            <div className={`absolute inset-y-0 ${isRtl ? 'left-2' : 'right-2'} flex items-center z-10`}>
              <button
                onClick={toggleListening}
                type="button"
                className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' 
                    : 'text-slate-400 hover:text-scandi-blue hover:bg-slate-100'
                }`}
                title={isListening ? "Stop listening" : "Search with voice"}
                id="voice-search-btn"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {listeningStatus && (
          <div className="max-w-xl mx-auto text-center animate-fade-in">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs border ${
              isListening 
                ? 'bg-red-50 text-red-700 border-red-150 animate-pulse' 
                : 'bg-slate-50 text-slate-600 border-slate-150'
            }`}>
              {isListening ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              )}
              <span>{listeningStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Weather widget from the professional mockup for extra polish */}
      <div className="bg-gradient-to-r from-scandi-blue to-[#003F6B] text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-scandi-yellow text-scandi-dark rounded w-fit">
            Current Weather
          </div>
          <h2 className="text-2xl font-bold mt-2.5">Stockholm</h2>
          <p className="text-slate-200 text-xs mt-0.5">Mostly Clear • High 14°C Low 6°C</p>
        </div>
        <div className="text-right flex items-center gap-3 sm:flex-col sm:gap-0">
          <div className="text-3xl font-light">12°C</div>
          <p className="text-slate-200 text-xs">Sunday, 5 Jul</p>
        </div>
      </div>

      {/* Grid of Assistants */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
          {t.exploreCities} & {t.premium}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const details = itemDetails[item.id] || { tag: 'Explore', bg: 'bg-slate-50', text: 'text-slate-700', desc: '' };
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between text-left transition-all duration-200 transform hover:-translate-y-1 hover:border-scandi-blue hover:shadow-md cursor-pointer h-full group"
                id={`nav-${item.id}`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${details.bg} ${details.text}`}>
                      {details.tag}
                    </span>
                    <IconComponent className="w-5 h-5 text-slate-400 group-hover:text-scandi-blue transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-scandi-blue transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-1 line-clamp-2">
                      {details.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Sweden Facts Panel */}
      <div className="p-6 bg-scandi-yellow/10 border border-scandi-yellow/20 rounded-2xl flex items-start gap-4">
        <span className="text-3xl">💡</span>
        <div className="space-y-1">
          <h4 className="font-bold text-scandi-dark text-sm">Fika & Travel Tip</h4>
          <p className="text-slate-700 text-xs leading-relaxed">
            Sweden is virtually cashless; you will need a credit/debit card or mobile payment for almost everything, including single bus rides. Don't miss a daily "Fika" — the sacred Swedish break for coffee and cinnamon buns!
          </p>
        </div>
      </div>
    </div>
  );
}
