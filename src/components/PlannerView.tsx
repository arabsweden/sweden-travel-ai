import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Car, 
  Utensils, 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  Share,
  Share2, 
  Compass, 
  Clock, 
  CheckCircle,
  Eye, 
  Plus, 
  Minus,
  MessageSquareShare,
  Loader2,
  ChevronDown,
  Download,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Language, TravelPreferences, SavedItinerary, GoogleChatSpace } from '../types';
import { TRANSLATIONS, STATIC_CITIES } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { generateItineraryPDF } from '../utils/pdfGenerator';
import TravelCalendar from './TravelCalendar';
import ScheduleVisualizer from './ScheduleVisualizer';

interface PlannerViewProps {
  language: Language;
  onBack: () => void;
  user: any;
  accessToken: string | null;
  onLogin: () => void;
}

export default function PlannerView({
  language,
  onBack,
  user,
  accessToken,
  onLogin
}: PlannerViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  // State
  const [step, setStep] = useState<1 | 2>(1); // 1: Questionnaire, 2: Itinerary Output
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  
  // Questionnaire preferences
  const [departureCountry, setDepartureCountry] = useState('United States');
  const [startDate, setStartDate] = useState('2026-07-10');
  const [endDate, setEndDate] = useState('2026-07-17');
  const [budget, setBudget] = useState<'Budget' | 'Comfort' | 'Luxury'>('Comfort');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelStyle, setTravelStyle] = useState('Family & Sightseeing');
  const [preferredCities, setPreferredCities] = useState<string[]>(['Stockholm']);
  const [transportation, setTransportation] = useState('Trains (SL & SJ)');
  const [hotelRating, setHotelRating] = useState(4);
  const [dietaryPreferences, setDietaryPreferences] = useState('Vegetarian or Halal');
  const [languagesSpoken, setLanguagesSpoken] = useState('English');

  // Saving / Sharing State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [showChatShare, setShowChatShare] = useState(false);
  const [chatSpaces, setChatSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [isFetchingSpaces, setIsFetchingSpaces] = useState(false);
  const [isSharingToChat, setIsSharingToChat] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);

  // Smart Summary State
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const generateSummary = async (itineraryData: any) => {
    if (!itineraryData) return;
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/itinerary-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itinerary: itineraryData, language })
      });
      const data = await response.json();
      if (response.ok && data && data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setSummaryError(err.message || 'Could not load summary');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (itinerary) {
      generateSummary(itinerary);
    } else {
      setSummary('');
    }
  }, [itinerary]);

  // Native Web Share state & handler
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const handleSelectDay = (dayNum: number) => {
    setFocusedDay(dayNum);
    setTimeout(() => {
      const element = document.getElementById(`itinerary-day-${dayNum}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleNativeShare = async () => {
    if (!itinerary) return;
    const shareData = {
      title: itinerary.title || 'My Sweden Itinerary',
      text: `${itinerary.title || 'My Sweden Itinerary'}\n` +
        `${language === 'ar' ? 'البلد المغادر منه' : language === 'sv' ? 'Avreseort' : 'Departure Country'}: ${itinerary.departureCountry || 'N/A'}\n\n` +
        (itinerary.itineraryDays || []).map((day: any) => `📅 Day ${day.day}: ${day.title}\n${day.description}`).join('\n\n'),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast(language === 'ar' ? 'تمت المشاركة بنجاح!' : language === 'sv' ? 'Delat med framgång!' : 'Shared successfully!');
        setTimeout(() => setShareToast(null), 3500);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const textToCopy = `🇸🇪 ${itinerary.title || 'My Sweden Itinerary'}\n` +
      `${language === 'ar' ? 'البلد المغادر منه' : language === 'sv' ? 'Avreseort' : 'Departure Country'}: ${itinerary.departureCountry || 'N/A'}\n\n` +
      (itinerary.itineraryDays || []).map((day: any) => `📅 Day ${day.day}: ${day.title}\n📝 ${day.description}`).join('\n\n') +
      `\n\nShared via Sweden Travel App: ${window.location.href}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setShareToast(language === 'ar' ? 'تم نسخ تفاصيل الرحلة إلى الحافظة بنجاح!' : language === 'sv' ? 'Kopierade resplanen till urklipp!' : 'Itinerary copied to clipboard!');
        setTimeout(() => setShareToast(null), 3500);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        setShareToast(language === 'ar' ? 'فشل نسخ الرابط.' : language === 'sv' ? 'Misslyckades med att kopiera till urklipp.' : 'Failed to copy to clipboard.');
        setTimeout(() => setShareToast(null), 3500);
      });
  };

  const availableCities = STATIC_CITIES.map(c => c.name);

  const toggleCity = (city: string) => {
    if (preferredCities.includes(city)) {
      setPreferredCities(preferredCities.filter(c => c !== city));
    } else {
      setPreferredCities([...preferredCities, city]);
    }
  };

  // Generate Trip Plan via Express Server Proxied Gemini Model
  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    setShareResult(null);
    try {
      const prefs: TravelPreferences = {
        departureCountry,
        startDate,
        endDate,
        budget,
        travelers: { adults, children },
        travelStyle,
        preferredCities,
        transportation,
        hotelRating,
        dietaryPreferences,
        languagesSpoken
      };

      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefs, language })
      });

      const data = await response.json();
      if (response.ok && data) {
        setItinerary(data);
        setStep(2);
      } else {
        throw new Error(data.error || 'Failed to generate');
      }
    } catch (err: any) {
      console.error(err);
      alert(language === 'ar' ? 'فشل توليد الخطة. يرجى التحقق من المدخلات.' : 'Failed to generate trip plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Plan to Firestore Database
  const handleSaveItinerary = async () => {
    if (!user) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول لحفظ خطة رحلتك.' : 'Please sign in to save your trip.');
      onLogin();
      return;
    }
    
    setIsSaving(true);
    try {
      const docData = {
        userId: user.uid,
        title: itinerary.title || `${preferredCities.join(' & ')} Trip`,
        departureCountry,
        startDate,
        endDate,
        budget,
        travelStyle,
        preferredCities,
        itineraryDays: itinerary.itineraryDays || [],
        estimatedCosts: itinerary.estimatedCosts || {},
        createdAt: new Date().toISOString()
      };
      
      const path = 'itineraries';
      // Securely addDoc with permission tracking
      const docRef = await addDoc(collection(db, path), docData);
      setSaveSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'itineraries');
    } finally {
      setIsSaving(false);
    }
  };

  // Download Itinerary as a beautiful PDF
  const handleDownloadPDF = () => {
    if (!itinerary) return;
    const pdfData = {
      title: itinerary.title,
      departureCountry,
      startDate,
      endDate,
      budget,
      travelStyle,
      adults,
      children,
      preferredCities,
      itineraryDays: itinerary.itineraryDays || [],
      estimatedCosts: itinerary.estimatedCosts || {}
    };
    generateItineraryPDF(pdfData, language);
  };

  // Fetch Google Chat spaces using OAuth Cached Access Token
  const handleLoadChatSpaces = async () => {
    if (!accessToken) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول للحصول على صلاحيات جوجل شات.' : 'Please sign in with Google to load Google Chat.');
      return;
    }
    setIsFetchingSpaces(true);
    setShowChatShare(true);
    setShareResult(null);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (data.spaces) {
        setChatSpaces(data.spaces);
        if (data.spaces.length > 0) {
          setSelectedSpace(data.spaces[0].name);
        }
      } else {
        setChatSpaces([]);
      }
    } catch (err) {
      console.error('Error fetching chat spaces:', err);
    } finally {
      setIsFetchingSpaces(false);
    }
  };

  // Share formatted Itinerary as Google Chat message (with mandatory mutation confirmation)
  const handleShareToGoogleChat = async () => {
    if (!selectedSpace) return;
    const spaceObj = chatSpaces.find(s => s.name === selectedSpace);
    const spaceName = spaceObj ? spaceObj.displayName : 'Selected Space';

    // MANDATORY USER CONFIRMATION GATED MUTATION
    const confirmed = window.confirm(
      language === 'ar' 
        ? `هل أنت متأكد من رغبتك في إرسال خطة رحلة السويد هذه إلى مساحة جوجل شات: "${spaceName}"؟`
        : `Are you sure you want Sweden Travel AI to post this Sweden travel itinerary to the Google Chat space: "${spaceName}"?`
    );
    if (!confirmed) return;

    setIsSharingToChat(true);
    setShareResult(null);
    try {
      // Build high-value text card representation
      let bodyText = `🇸🇪 *Sweden Travel AI - Travel Itinerary Recommendation*\n`;
      bodyText += `*Trip Title:* ${itinerary.title || 'Personalized Trip'}\n`;
      bodyText += `*Dates:* ${startDate} to ${endDate} | *Travelers:* ${adults} Adults, ${children} Children\n`;
      bodyText += `*Departure Country:* ${departureCountry}\n`;
      bodyText += `*Style & Budget:* ${travelStyle} (${budget})\n\n`;
      
      if (customMsg) {
        bodyText += `_User Note:_ "${customMsg}"\n\n`;
      }

      bodyText += `*Day-by-Day Summary:*\n`;
      itinerary.itineraryDays.forEach((day: any) => {
        bodyText += `• *Day ${day.day}:* ${day.title}\n`;
      });
      
      bodyText += `\n*Estimated Budget:* ${itinerary.estimatedCosts?.total || 'N/A'} SEK\n`;
      bodyText += `_Plan generated securely via Sweden Travel AI assistant._`;

      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ text: bodyText })
      });
      
      if (res.ok) {
        setShareResult('Success');
        setCustomMsg('');
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to post message');
      }
    } catch (err: any) {
      console.error('Failed to share to Chat:', err);
      setShareResult(`Error: ${err.message}`);
    } finally {
      setIsSharingToChat(false);
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          id="planner-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 2 ? t.backToHome : t.backToHome}
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="w-5 h-5 text-scandi-blue" />
          {t.planTrip}
        </h2>
      </div>

      {step === 1 ? (
        /* STEP 1: QUESTIONNAIRE FORM */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            {language === 'ar' ? 'حدد تفضيلات السفر لرحلتك المخصصة' : 'Customize Your Personalized Sweden Trip'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departure Country */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.departureCountry}</label>
              <input 
                type="text"
                value={departureCountry}
                onChange={(e) => setDepartureCountry(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-scandi-blue"
                id="pref-departure"
              />
            </div>

            {/* Travel Dates */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.travelDates}</label>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                        {language === 'ar' ? 'من' : language === 'sv' ? 'Från' : 'From'}
                      </span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-scandi-blue"
                        id="pref-start-date"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                        {language === 'ar' ? 'إلى' : language === 'sv' ? 'Till' : 'To'}
                      </span>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-scandi-blue"
                        id="pref-end-date"
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <TravelCalendar
                    language={language}
                    startDate={startDate}
                    endDate={endDate}
                    onChangeRange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.budgetStyle}</label>
              <div className="grid grid-cols-3 gap-2">
                {['Budget', 'Comfort', 'Luxury'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(b as any)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      budget === b 
                        ? 'bg-scandi-blue text-white border-scandi-blue' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    id={`budget-btn-${b}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Travelers counts */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.travelers}</label>
              <div className="flex gap-4">
                <div className="flex-1 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600">{t.adults}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="p-1 bg-white border border-slate-200 rounded text-slate-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-slate-800">{adults}</span>
                    <button 
                      onClick={() => setAdults(adults + 1)}
                      className="p-1 bg-white border border-slate-200 rounded text-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600">{t.children}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="p-1 bg-white border border-slate-200 rounded text-slate-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-slate-800">{children}</span>
                    <button 
                      onClick={() => setChildren(children + 1)}
                      className="p-1 bg-white border border-slate-200 rounded text-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel style tag */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.travelStyle}</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-scandi-blue"
                id="pref-style-select"
              >
                <option value="Family & Fun">Family & Sightseeing</option>
                <option value="Nature, Camping & Hiking">Nature, Hiking & Camping</option>
                <option value="Honeymoon & Luxury">Honeymoon & Romantic</option>
                <option value="Adventure & Sports">Adventure & Wintersports</option>
                <option value="Photography & Hidden Gems">Photography & Hidden Gems</option>
                <option value="History, Museums & Culture">History, Museums & Culture</option>
              </select>
            </div>

            {/* Transportation preferences */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{language === 'ar' ? 'المواصلات المفضلة' : 'Transportation Preferences'}</label>
              <select
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none"
                id="pref-transport"
              >
                <option value="Trains & Trams (Public transit)">Trains & Regional Trains (SL / SJ)</option>
                <option value="Rental Car">Rental Car (Highway road trip)</option>
                <option value="Domestic flights & trains">Domestic Flights & SJ Rail</option>
                <option value="Bicycle & Walking">Local bicycle and footpaths</option>
              </select>
            </div>

            {/* Hotel Stars */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{language === 'ar' ? 'فئة الفندق' : 'Hotel Star Rating'}</label>
              <div className="flex gap-2">
                {[3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setHotelRating(stars)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      hotelRating === stars 
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⭐ {stars} Stars
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary & languages */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">{t.dietary}</label>
              <input 
                type="text"
                placeholder="Halal only, Vegetarian, No restrictions..."
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Cities Multi-selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">{language === 'ar' ? 'المدن السويدية المراد تضمينها' : 'Swedish Cities to Include'}</label>
            <div className="flex flex-wrap gap-2">
              {availableCities.map((city) => {
                const isSelected = preferredCities.includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-scandi-blue text-white border-scandi-blue' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    id={`city-toggle-${city}`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isLoading || preferredCities.length === 0}
            className="w-full py-3.5 bg-scandi-blue hover:bg-scandi-blue/90 text-white rounded-xl font-bold tracking-wide shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer"
            id="plan-generate-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{language === 'ar' ? 'جاري تخطيط رحلتك بواسطة الذكاء الاصطناعي...' : 'Planning Your Trip with AI...'}</span>
              </>
            ) : (
              <>
                <Compass className="w-5 h-5" />
                <span>{t.generatePlan}</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* STEP 2: DISPLAY GENERATED ITINERARY */
        <div className="space-y-8 animate-fade-in">
          {/* Output Header Card */}
          <div className="bg-gradient-to-br from-scandi-blue to-scandi-dark text-white p-6 rounded-2xl shadow-md border border-slate-800/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-scandi-yellow uppercase tracking-widest block font-display">Sweden Travel AI Assistant</span>
                <h3 className="text-2xl font-extrabold text-white">{itinerary.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveItinerary}
                  disabled={isSaving || saveSuccess}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/50 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                  id="save-itinerary-btn"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? t.saving : saveSuccess ? (language === 'ar' ? 'تم الحفظ!' : 'Saved!') : (language === 'ar' ? 'حفظ في حسابي' : 'Save Plan')}
                </button>
                <button
                  onClick={handleLoadChatSpaces}
                  className="flex items-center gap-1.5 px-3 py-2 bg-scandi-yellow hover:bg-scandi-yellow/90 text-scandi-dark rounded-lg text-xs font-bold cursor-pointer transition-all"
                  id="load-spaces-btn"
                >
                  <Share2 className="w-4 h-4" />
                  {t.shareChat}
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                  id="native-share-btn"
                >
                  <Share className="w-4 h-4" />
                  {language === 'ar' ? 'مشاركة' : language === 'sv' ? 'Dela' : 'Share'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  id="download-pdf-btn"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  {language === 'ar' ? 'تحميل PDF' : language === 'sv' ? 'Ladda ner PDF' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* Native Share Toast notification */}
            {shareToast && (
              <div className="p-3 bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-2">
                  <Share className="w-3.5 h-3.5 text-scandi-yellow" />
                  {shareToast}
                </span>
                <button onClick={() => setShareToast(null)} className="text-indigo-400 hover:text-white font-bold ml-2 text-sm">×</button>
              </div>
            )}

            {/* Google Chat sharing widget */}
            {showChatShare && (
              <div className="p-4 bg-slate-800 border border-indigo-500/30 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquareShare className="w-4 h-4 text-indigo-400" />
                  Share with your Friends in Google Chat Space
                </h4>
                
                {isFetchingSpaces ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching Google Chat spaces...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatSpaces.length === 0 ? (
                      <p className="text-xs text-red-300">No Google Chat Spaces found. Join or create a space in your Google Chat app first.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                          value={selectedSpace}
                          onChange={(e) => setSelectedSpace(e.target.value)}
                          className="flex-1 p-2 bg-slate-900 border border-slate-700 text-white rounded text-xs focus:outline-none"
                          id="chat-spaces-select"
                        >
                          {chatSpaces.map(space => (
                            <option key={space.name} value={space.name}>{space.displayName}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          placeholder="Add custom message (optional)..."
                          value={customMsg}
                          onChange={(e) => setCustomMsg(e.target.value)}
                          className="flex-1 p-2 bg-slate-900 border border-slate-700 text-white text-xs rounded focus:outline-none"
                        />
                        <button
                          onClick={handleShareToGoogleChat}
                          disabled={isSharingToChat || !selectedSpace}
                          className="px-4 py-2 bg-yellow-400 text-slate-900 font-bold rounded text-xs hover:bg-yellow-300 transition-colors cursor-pointer"
                          id="post-chat-btn"
                        >
                          {isSharingToChat ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    )}
                    {shareResult && (
                      <div className={`p-2 rounded text-xs font-semibold ${shareResult === 'Success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800'}`}>
                        {shareResult === 'Success' ? 'Itinerary successfully shared with your Google Chat space!' : `Failed to share: ${shareResult}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Itinerary facts row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">{t.departureCountry}</span>
                <span className="font-semibold text-slate-200">{departureCountry}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.travelDates}</span>
                <span className="font-semibold text-slate-200">{startDate} - {endDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.travelers}</span>
                <span className="font-semibold text-slate-200">{adults} {t.adults}, {children} {t.children}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Style & Budget</span>
                <span className="font-semibold text-yellow-400">{travelStyle} ({budget})</span>
              </div>
            </div>
          </div>

          {/* Smart Summary Card */}
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {language === 'ar' ? 'الملخص الذكي للرحلة' : language === 'sv' ? 'Smart AI-sammanfattning' : 'Smart Itinerary Summary'}
                </h4>
              </div>
              {summary && !isSummaryLoading && (
                <button
                  onClick={() => generateSummary(itinerary)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-100/50 transition-colors cursor-pointer"
                  title={language === 'ar' ? 'إعادة التوليد' : language === 'sv' ? 'Generera om' : 'Regenerate Summary'}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                </button>
              )}
            </div>

            {isSummaryLoading ? (
              <div className="py-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs font-medium text-slate-500 animate-pulse">
                  {language === 'ar' ? 'جاري تلخيص مغامرتك السويدية...' : language === 'sv' ? 'Sammanfattar ditt svenska äventyr...' : 'Summarizing your Swedish adventure...'}
                </span>
              </div>
            ) : summaryError ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                <span>{summaryError}</span>
                <button
                  onClick={() => generateSummary(itinerary)}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 font-bold rounded border border-red-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {language === 'ar' ? 'إعادة المحاولة' : language === 'sv' ? 'Försök igen' : 'Retry'}
                </button>
              </div>
            ) : summary ? (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {summary}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {language === 'ar' ? 'لا يوجد ملخص متاح.' : language === 'sv' ? 'Ingen sammanfattning tillgänglig.' : 'No summary available.'}
              </p>
            )}
          </div>

          {/* Interactive Trip Calendar Schedule */}
          <ScheduleVisualizer
            language={language}
            startDate={startDate}
            endDate={endDate}
            itinerary={itinerary}
            onSelectDay={handleSelectDay}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Day timeline */}
            <div className="lg:col-span-2 space-y-6">
              {itinerary.itineraryDays?.map((day: any, i: number) => (
                <div 
                  key={i} 
                  id={`itinerary-day-${day.day}`}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    focusedDay === day.day 
                      ? 'ring-2 ring-indigo-600 border-transparent shadow-lg scale-[1.01]' 
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-900 text-yellow-400 rounded text-xs font-bold">DAY {day.day}</span>
                      {day.title}
                    </h4>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-slate-600 text-xs italic">{day.description}</p>
                    
                    {/* Daily activities timeline */}
                    <div className="relative border-l border-slate-200 pl-4 space-y-6">
                      {day.activities?.map((act: any, actIdx: number) => (
                        <div key={actIdx} className="relative">
                          {/* Circle indicator */}
                          <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-sm"></div>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {act.time}
                            </span>
                            <h5 className="font-bold text-sm text-slate-900">{act.title}</h5>
                            {act.location && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                <MapPin className="w-2.5 h-2.5" />
                                {act.location}
                              </span>
                            )}
                            <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>
                            {act.cost && (
                              <span className="text-[10px] font-semibold text-emerald-600 block">Est Cost: {act.cost}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Costs & Maps sidebar */}
            <div className="space-y-6">
              {/* Cost estimates */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Estimated Cost Breakdown
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  {Object.entries(itinerary.estimatedCosts || {}).map(([category, cost]: any) => {
                    if (category === 'total') return null;
                    return (
                      <div key={category} className="flex justify-between items-center text-slate-600">
                        <span className="capitalize">{category}</span>
                        <span className="font-semibold text-slate-800">{cost} SEK</span>
                      </div>
                    );
                  })}
                  
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Total Estimated Budget</span>
                    <span className="text-indigo-600 text-lg">{itinerary.estimatedCosts?.total || 'N/A'} SEK</span>
                  </div>
                </div>
              </div>

              {/* Interactive Mock Map Vector representation */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  Sweden Trip Map Route
                </h4>
                
                {/* SVG Route Graphic representing swedish shape */}
                <div className="bg-slate-50 rounded-xl h-60 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full opacity-40 absolute" viewBox="0 0 100 200" fill="none">
                    <path d="M45,10 C50,25 40,40 45,60 C48,70 55,80 50,100 C45,120 35,130 40,150 C45,160 55,170 50,190" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                  </svg>

                  {/* Cities mapped out */}
                  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-rose-600 rounded-full absolute"></div>
                    <span className="text-[9px] font-bold text-slate-700 bg-white/85 px-1 py-0.5 rounded shadow mt-1">Kiruna</span>
                  </div>

                  <div className="absolute top-1/2 left-2/5 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-700 bg-white/85 px-1 py-0.5 rounded shadow mt-1">Uppsala</span>
                  </div>

                  <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow animate-bounce">1</div>
                    <span className="text-[9px] font-extrabold text-slate-900 bg-yellow-400 px-1 py-0.5 rounded shadow mt-1">Stockholm</span>
                  </div>

                  <div className="absolute top-3/4 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-700 bg-white/85 px-1 py-0.5 rounded shadow mt-1">Gothenburg</span>
                  </div>

                  <div className="absolute bottom-6 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-700 bg-white/85 px-1 py-0.5 rounded shadow mt-1">Malmö</span>
                  </div>
                </div>
              </div>

              {/* Travel advice & lists */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-bold text-yellow-400 text-sm">Packing & Safety Tips</h4>
                
                {itinerary.packingList && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-300 font-semibold block">Packing Suggestions:</span>
                    <ul className="list-disc pl-4 pr-4 space-y-1 text-[11px] text-slate-200">
                      {itinerary.packingList.slice(0, 4).map((p: string, idx: number) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {itinerary.safetyAdvice && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-300 font-semibold block">Safety Advice:</span>
                    <ul className="list-disc pl-4 pr-4 space-y-1 text-[11px] text-slate-200">
                      {itinerary.safetyAdvice.slice(0, 3).map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
