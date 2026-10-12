import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Ticket, 
  Sparkles, 
  Camera, 
  Info, 
  Heart, 
  Star, 
  Utensils, 
  Compass, 
  Eye, 
  Building2,
  Calendar,
  Share
} from 'lucide-react';
import { Language, CityGuide, Attraction, FavoriteItem } from '../types';
import { TRANSLATIONS, STATIC_CITIES, STATIC_ATTRACTIONS } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { motion } from 'motion/react';

interface ExploreViewProps {
  language: Language;
  defaultView?: 'cities' | 'attractions';
  onBack: () => void;
  user: any;
}

export default function ExploreView({
  language,
  defaultView = 'cities',
  onBack,
  user
}: ExploreViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [activeTab, setActiveTab] = useState<'cities' | 'attractions'>(defaultView);
  const [selectedCity, setSelectedCity] = useState<CityGuide | null>(STATIC_CITIES[0]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);

  // Web Share API states and handlers
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShareCity = async (city: CityGuide) => {
    const shareData = {
      title: `${city.name} - Sweden Travel Guide`,
      text: `${city.name} Guide:\n${city.description}\n\nTop Attractions: ${city.topAttractions.join(', ')}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast(language === 'ar' ? 'تمت مشاركة دليل المدينة!' : language === 'sv' ? 'Stadsguide delad!' : 'City guide shared!');
        setTimeout(() => setShareToast(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          fallbackShareCity(city);
        }
      }
    } else {
      fallbackShareCity(city);
    }
  };

  const fallbackShareCity = (city: CityGuide) => {
    const textToCopy = `🏙️ ${city.name} - Sweden Travel Guide\n\n` +
      `${city.description}\n\n` +
      `✨ Top Attractions:\n` + city.topAttractions.map(a => `- ${a}`).join('\n') + `\n\n` +
      `🏨 Recommended Hotels:\n` + city.bestHotels.map(h => `- ${h}`).join('\n') + `\n\n` +
      `🍽️ Traditional Foods:\n` + city.localFood.map(f => `- ${f}`).join('\n') + `\n\n` +
      `Shared via Sweden Travel App: ${window.location.href}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setShareToast(language === 'ar' ? 'تم نسخ دليل المدينة إلى الحافظة بنجاح!' : language === 'sv' ? 'Kopierade stadsguiden till urklipp!' : 'City guide copied to clipboard!');
        setTimeout(() => setShareToast(null), 3000);
      })
      .catch((err) => {
        console.error(err);
        setShareToast(language === 'ar' ? 'فشل نسخ الدليل.' : language === 'sv' ? 'Misslyckades med att kopiera guide.' : 'Failed to copy guide.');
        setTimeout(() => setShareToast(null), 3000);
      });
  };

  const handleShareAttraction = async (attr: Attraction) => {
    const shareData = {
      title: `${attr.name} - Sweden Attraction`,
      text: `${attr.name}:\n${attr.description}\n\nBest Time to Visit: ${attr.bestTime}\nTicket Price: ${attr.ticketPrice}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast(language === 'ar' ? 'تمت مشاركة تفاصيل المعلم السياحي!' : language === 'sv' ? 'Attraktion delad!' : 'Attraction details shared!');
        setTimeout(() => setShareToast(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          fallbackShareAttraction(attr);
        }
      }
    } else {
      fallbackShareAttraction(attr);
    }
  };

  const fallbackShareAttraction = (attr: Attraction) => {
    const textToCopy = `🏰 ${attr.name} - Sweden Attraction\n\n` +
      `${attr.description}\n\n` +
      `ℹ️ Info:\n` +
      `- Hours: ${attr.openingHours}\n` +
      `- Tickets: ${attr.ticketPrice}\n` +
      `- Duration: ${attr.duration}\n` +
      `- Best Time: ${attr.bestTime}\n\n` +
      `📸 Photo Tip: ${attr.photographyTips}\n\n` +
      `Shared via Sweden Travel App: ${window.location.href}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setShareToast(language === 'ar' ? 'تم نسخ تفاصيل المعلم إلى الحافظة!' : language === 'sv' ? 'Kopierade attraktionen till urklipp!' : 'Attraction details copied to clipboard!');
        setTimeout(() => setShareToast(null), 3000);
      })
      .catch((err) => {
        console.error(err);
        setShareToast(language === 'ar' ? 'فشل نسخ التفاصيل.' : language === 'sv' ? 'Misslyckades med att kopiera detaljer.' : 'Failed to copy details.');
        setTimeout(() => setShareToast(null), 3000);
      });
  };

  // Favorites tracking
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSyncingFavs, setIsSyncingFavs] = useState(false);

  // Load favorites from Firestore or LocalStorage fallback
  useEffect(() => {
    const fetchFavs = async () => {
      if (user) {
        setIsSyncingFavs(true);
        try {
          const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          const ids: string[] = [];
          snapshot.forEach(doc => {
            ids.push(doc.data().itemId);
          });
          setFavorites(ids);
        } catch (err) {
          console.error('Error fetching favorites:', err);
          // Fallback to local
          const local = localStorage.getItem(`favs_${user.uid}`);
          if (local) setFavorites(JSON.parse(local));
        } finally {
          setIsSyncingFavs(false);
        }
      } else {
        const guest = localStorage.getItem('favs_guest');
        if (guest) setFavorites(JSON.parse(guest));
      }
    };
    fetchFavs();
  }, [user]);

  const toggleFavorite = async (itemType: 'city' | 'attraction', itemId: string, itemName: string, itemImage: string) => {
    const isFav = favorites.includes(itemId);
    let updated: string[] = [];
    
    if (isFav) {
      updated = favorites.filter(id => id !== itemId);
      setFavorites(updated);
      
      // Delete from Firestore
      if (user) {
        try {
          const q = query(
            collection(db, 'favorites'), 
            where('userId', '==', user.uid),
            where('itemId', '==', itemId)
          );
          const snap = await getDocs(q);
          snap.forEach(async (d) => {
            await deleteDoc(doc(db, 'favorites', d.id));
          });
          localStorage.setItem(`favs_${user.uid}`, JSON.stringify(updated));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'favorites');
        }
      } else {
        localStorage.setItem('favs_guest', JSON.stringify(updated));
      }
    } else {
      updated = [...favorites, itemId];
      setFavorites(updated);
      
      // Save to Firestore
      if (user) {
        try {
          const favData = {
            userId: user.uid,
            itemType,
            itemId,
            itemName,
            itemImage,
            savedAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'favorites'), favData);
          localStorage.setItem(`favs_${user.uid}`, JSON.stringify(updated));
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'favorites');
        }
      } else {
        localStorage.setItem('favs_guest', JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* View Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {t.backToHome}
        </button>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('cities'); setSelectedAttraction(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'cities' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
            id="tab-cities-btn"
          >
            {t.exploreCities}
          </button>
          <button
            onClick={() => { setActiveTab('attractions'); setSelectedCity(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'attractions' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
            id="tab-attractions-btn"
          >
            {t.attractions}
          </button>
        </div>
      </div>

      {activeTab === 'cities' ? (
        /* CITIES EXPLORER */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cities list sidebar (14 cities) */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-[580px] overflow-y-auto space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase px-2 mb-2 block">14 Sweden Cities</span>
            {STATIC_CITIES.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-scandi-blue text-white shadow-md' 
                      : 'hover:bg-slate-50 text-slate-700 hover:text-scandi-blue'
                  }`}
                  id={`city-btn-${city.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏙️</span>
                    <span className="text-xs font-bold">{city.name}</span>
                  </div>
                  {favorites.includes(city.id) && (
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* City guide main content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCity ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Hero Banner */}
                <div className="h-56 relative">
                  <img 
                    src={selectedCity.image} 
                    alt={selectedCity.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-scandi-yellow uppercase tracking-widest font-display">Swedish City Guide</span>
                      <h3 className="text-2xl font-extrabold">{selectedCity.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShareCity(selectedCity)}
                        className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md shadow cursor-pointer transition-colors"
                        title={language === 'ar' ? 'مشاركة' : language === 'sv' ? 'Dela' : 'Share'}
                        id={`share-city-btn-${selectedCity.id}`}
                      >
                        <Share className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => toggleFavorite('city', selectedCity.id, selectedCity.name, selectedCity.image)}
                        className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md shadow cursor-pointer transition-colors"
                        id={`fav-btn-${selectedCity.id}`}
                      >
                        <Heart className={`w-5 h-5 ${favorites.includes(selectedCity.id) ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {shareToast && (
                  <div className="mx-6 mt-4 p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                    <span className="flex items-center gap-2">
                      <Share className="w-3.5 h-3.5 text-indigo-600" />
                      {shareToast}
                    </span>
                    <button onClick={() => setShareToast(null)} className="text-indigo-400 hover:text-indigo-800 font-bold ml-2">×</button>
                  </div>
                )}

                {/* Details Tabbed grid */}
                <div className="p-6 space-y-6 text-xs">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">About the City</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{selectedCity.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    {/* Top Attractions & Museums */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-600">
                        <Sparkles className="w-4 h-4" />
                        Must-See Attractions
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.topAttractions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>

                    {/* Best Hotels */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-600">
                        <Building2 className="w-4 h-4" />
                        Best Hotels
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.bestHotels.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </div>

                    {/* Nature & Wildlife */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-green-600">
                        🌳 Nature & Outdoors
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.nature.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>

                    {/* Local Food Specialties */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-amber-600">
                        <Utensils className="w-4 h-4" />
                        Traditional Local Food
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.localFood.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {/* Family Activities */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-rose-600">
                        👶 Family & Child Friendly
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.familyActivities.map((fa, i) => <li key={i}>{fa}</li>)}
                      </ul>
                    </div>

                    {/* Walking routes */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-cyan-600">
                        🚶 Recommended Walking Routes
                      </h5>
                      <ul className="space-y-1.5 pl-4 pr-4 list-disc text-slate-600">
                        {selectedCity.walkingRoutes.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="text-slate-500 text-xs">Select a city to explore its travel guide.</p>
            )}
          </div>
        </div>
      ) : (
        /* ATTRACTIONS DIRECTORY */
        <div className="space-y-6">
          {/* List of Attractions */}
          {!selectedAttraction ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STATIC_ATTRACTIONS.map((attr, index) => (
                <motion.div 
                  key={attr.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.45, delay: (index % 3) * 0.08, ease: 'easeOut' }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 relative">
                      <img src={attr.image} alt={attr.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => toggleFavorite('attraction', attr.id, attr.name, attr.image)}
                        className="absolute right-3 top-3 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow cursor-pointer transition-colors"
                        id={`fav-btn-${attr.id}`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(attr.id) ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900">{attr.name}</h4>
                      <p className="text-slate-500 text-xs line-clamp-3">{attr.description}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">{attr.duration}</span>
                    <button
                      onClick={() => setSelectedAttraction(attr)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      id={`view-attr-btn-${attr.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Selected Attraction detailed guide view */
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6"
            >
              <div className="h-64 relative">
                <img src={selectedAttraction.image} alt={selectedAttraction.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                
                <button
                  onClick={() => setSelectedAttraction(null)}
                  className="absolute left-4 top-4 px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow hover:bg-slate-50 cursor-pointer"
                  id="close-attr-details-btn"
                >
                  ← Back to List
                </button>

                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                  <h3 className="text-2xl font-extrabold">{selectedAttraction.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareAttraction(selectedAttraction)}
                      className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md shadow cursor-pointer transition-colors"
                      title={language === 'ar' ? 'مشاركة' : language === 'sv' ? 'Dela' : 'Share'}
                      id={`share-attr-btn-${selectedAttraction.id}`}
                    >
                      <Share className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => toggleFavorite('attraction', selectedAttraction.id, selectedAttraction.name, selectedAttraction.image)}
                      className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md shadow cursor-pointer transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(selectedAttraction.id) ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {shareToast && (
                <div className="mx-6 mt-4 p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                  <span className="flex items-center gap-2">
                    <Share className="w-3.5 h-3.5 text-indigo-600" />
                    {shareToast}
                  </span>
                  <button onClick={() => setShareToast(null)} className="text-indigo-400 hover:text-indigo-800 font-bold ml-2">×</button>
                </div>
              )}

              <div className="p-6 space-y-6 text-xs text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left columns: detailed text */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-600" />
                        About the Attraction
                      </h4>
                      <p className="leading-relaxed">{selectedAttraction.description}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      <h5 className="font-bold text-xs text-slate-900">{t.history} & Background</h5>
                      <p className="leading-relaxed">{selectedAttraction.history}</p>
                    </div>

                    <div className="p-4 bg-yellow-50/50 rounded-xl space-y-2 border border-yellow-100/50">
                      <h5 className="font-bold text-xs text-yellow-900">{t.interestingFacts}</h5>
                      <p className="leading-relaxed text-yellow-850">{selectedAttraction.interestingFacts}</p>
                    </div>
                  </div>

                  {/* Right column: facts & timing specifications */}
                  <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                    <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Visitor Information
                    </h4>

                    <div className="space-y-3.5">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Opening Hours</span>
                        <span className="font-semibold text-slate-800">{selectedAttraction.openingHours}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Ticket Prices</span>
                        <span className="font-semibold text-emerald-600">{selectedAttraction.ticketPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Best Time to Visit</span>
                        <span className="font-semibold text-slate-850">{selectedAttraction.bestTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Est. Visit Duration</span>
                        <span className="font-semibold text-slate-800">{selectedAttraction.duration}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Accessibility</span>
                        <span className="font-semibold text-slate-850 text-[11px]">{selectedAttraction.accessibility}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Family Suitability</span>
                        <span className="font-semibold text-slate-850 text-[11px]">{selectedAttraction.familySuitability}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                      <h5 className="font-extrabold text-[10px] text-slate-800 uppercase flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        Photography Tips
                      </h5>
                      <p className="text-[11px] leading-relaxed text-slate-500 italic">{selectedAttraction.photographyTips}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
