import React, { useState } from 'react';
import { 
  Hotel as HotelIcon, 
  Plane, 
  MapPin, 
  Star, 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Sparkles,
  Heart,
  Calendar
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, STATIC_HOTELS } from '../constants';

const STATIC_FLIGHTS = [
  { id: 'f1', airline: 'Scandinavian Airlines (SAS)', from: 'London LHR', to: 'Stockholm ARN', duration: '2h 15m', stops: 0, price: 1200 },
  { id: 'f2', airline: 'British Airways', from: 'London LHR', to: 'Stockholm ARN', duration: '2h 20m', stops: 0, price: 1550 },
  { id: 'f3', airline: 'Ryanair', from: 'London STN', to: 'Stockholm ARN', duration: '2h 30m', stops: 0, price: 450 },
  { id: 'f4', airline: 'Emirates', from: 'Dubai DXB', to: 'Stockholm ARN', duration: '6h 45m', stops: 0, price: 5400 },
  { id: 'f5', airline: 'Qatar Airways', from: 'Doha DOH', to: 'Stockholm ARN', duration: '6h 15m', stops: 0, price: 5200 },
  { id: 'f6', airline: 'Lufthansa', from: 'London LHR', to: 'Stockholm ARN', duration: '4h 10m', stops: 1, price: 1100 },
  { id: 'f7', airline: 'Turkish Airlines', from: 'Istanbul IST', to: 'Stockholm ARN', duration: '3h 40m', stops: 0, price: 2900 },
  { id: 'f8', airline: 'Norwegian', from: 'London LHR', to: 'Stockholm ARN', duration: '2h 20m', stops: 0, price: 850 }
];

interface AssistantViewProps {
  language: Language;
  defaultMode?: 'hotels' | 'flights';
  onBack: () => void;
}

export default function AssistantView({
  language,
  defaultMode = 'hotels',
  onBack
}: AssistantViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [mode, setMode] = useState<'hotels' | 'flights'>(defaultMode);

  // Hotel filters state
  const [hotelCity, setHotelCity] = useState('Stockholm');
  const [hotelBudget, setHotelBudget] = useState('all');
  const [hotelRating, setHotelRating] = useState('all');
  const [isKidFriendly, setIsKidFriendly] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);

  // Flight filters state
  const [flightFrom, setFlightFrom] = useState('London LHR');
  const [flightTo, setFlightTo] = useState('Stockholm ARN');
  const [flightClass, setFlightClass] = useState('economy');
  const [flightStops, setFlightStops] = useState('any');

  // Filter Hotels matching selected criteria
  const filteredHotels = STATIC_HOTELS.filter((hotel) => {
    if (hotelCity !== 'all' && hotel.city.toLowerCase() !== hotelCity.toLowerCase()) return false;
    
    const price = hotel.pricePerNight;
    if (hotelBudget !== 'all') {
      if (hotelBudget === 'budget' && price > 1200) return false;
      if (hotelBudget === 'comfort' && (price < 1200 || price > 2500)) return false;
      if (hotelBudget === 'luxury' && price < 2500) return false;
    }

    if (hotelRating !== 'all' && hotel.rating < parseInt(hotelRating)) return false;

    const kidFriendly = hotel.amenities.some(a => a.toLowerCase().includes('family') || a.toLowerCase().includes('kid') || a.toLowerCase().includes('play'));
    const accessible = hotel.amenities.some(a => a.toLowerCase().includes('access') || a.toLowerCase().includes('wheelchair'));

    if (isKidFriendly && !kidFriendly) return false;
    if (isAccessible && !accessible) return false;

    return true;
  });


  // Filter Flights matching criteria
  const filteredFlights = STATIC_FLIGHTS.filter((flight) => {
    if (flightFrom && !flight.from.toLowerCase().includes(flightFrom.toLowerCase())) return false;
    if (flightTo && !flight.to.toLowerCase().includes(flightTo.toLowerCase())) return false;
    if (flightStops !== 'any' && flight.stops !== parseInt(flightStops)) return false;
    return true;
  });

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
        >
          {t.backToHome}
        </button>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('hotels')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'hotels' ? 'bg-slate-900 text-yellow-400 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏨 Hotel Finder
          </button>
          <button
            onClick={() => setMode('flights')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'flights' ? 'bg-slate-900 text-yellow-400 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✈️ Flight Comparative
          </button>
        </div>
      </div>

      {mode === 'hotels' ? (
        /* HOTEL FINDER */
        <div className="space-y-6 animate-fade-in">
          {/* Hotel Filters Container */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Filter Hotels in Sweden
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* City Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-600 font-semibold block">Select City</label>
                <select 
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  id="hotel-city-select"
                >
                  <option value="all">All Sweden Cities</option>
                  <option value="Stockholm">Stockholm</option>
                  <option value="Gothenburg">Gothenburg</option>
                  <option value="Malmö">Malmö</option>
                  <option value="Kiruna">Kiruna</option>
                  <option value="Visby">Visby</option>
                </select>
              </div>

              {/* Price Tier */}
              <div className="space-y-1.5">
                <label className="text-slate-600 font-semibold block">Price Budget</label>
                <select 
                  value={hotelBudget}
                  onChange={(e) => setHotelBudget(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  id="hotel-budget-select"
                >
                  <option value="all">All Budgets</option>
                  <option value="budget">Budget (Under 1,200 SEK)</option>
                  <option value="comfort">Comfort (1,200 - 2,500 SEK)</option>
                  <option value="luxury">Luxury (Over 2,500 SEK)</option>
                </select>
              </div>

              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-slate-600 font-semibold block">Minimum Rating</label>
                <select 
                  value={hotelRating}
                  onChange={(e) => setHotelRating(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  id="hotel-rating-select"
                >
                  <option value="all">Any Rating</option>
                  <option value="3">⭐⭐⭐ 3 Stars & up</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars & up</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars only</option>
                </select>
              </div>
            </div>

            {/* Accessibility / Kid Friendly options */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input 
                  type="checkbox" 
                  checked={isKidFriendly} 
                  onChange={(e) => setIsKidFriendly(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                👶 Kid & Family Friendly
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input 
                  type="checkbox" 
                  checked={isAccessible} 
                  onChange={(e) => setIsAccessible(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                ♿ Full Accessibility Facilities
              </label>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.length === 0 ? (
              <div className="col-span-full bg-slate-50 rounded-2xl p-12 text-center text-slate-400 border border-slate-200/50">
                No hotels match your filters. Try selecting a broader category.
              </div>
            ) : (
              filteredHotels.map((hotel) => {
                const isHotelKidFriendly = hotel.amenities.some(a => a.toLowerCase().includes('family') || a.toLowerCase().includes('kid') || a.toLowerCase().includes('play'));
                const isHotelAccessible = hotel.amenities.some(a => a.toLowerCase().includes('access') || a.toLowerCase().includes('wheelchair'));
                const hasSauna = hotel.amenities.some(a => a.toLowerCase().includes('sauna') || a.toLowerCase().includes('bath'));
                const hasSpa = hotel.amenities.some(a => a.toLowerCase().includes('spa'));
                const hotelDesc = hotel.amenities.join(', ');
                const hotelLocation = 'Sweden';
                const hotelPrice = hotel.pricePerNight;

                return (
                  <div 
                    key={hotel.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 relative">
                        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                        <div className="absolute left-3 top-3 px-2 py-1 bg-slate-900/80 text-yellow-400 rounded-lg text-[10px] font-bold">
                          {hotel.city}
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-amber-500 gap-0.5 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {hotel.rating} Stars
                          </span>
                          <span className="text-slate-400 font-semibold">{hotelLocation}</span>
                        </div>
                        
                        <h4 className="font-extrabold text-sm text-slate-900">{hotel.name}</h4>
                        
                        <p className="text-slate-500 leading-relaxed text-[11px] line-clamp-2">{hotelDesc}</p>

                        {/* Amenities Row */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {isHotelKidFriendly && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-semibold rounded">Family Friendly</span>}
                          {isHotelAccessible && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-semibold rounded">Wheelchair Accessible</span>}
                          {hasSauna && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-semibold rounded">🧖 Sauna</span>}
                          {hasSpa && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-semibold rounded">🌸 Spa</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Per Night</span>
                        <span className="text-indigo-600 font-bold text-sm">{hotelPrice} SEK</span>
                      </div>
                      <button 
                        onClick={() => alert(`Direct booking with ${hotel.name} would proceed via booking engines in Sweden Travel AI production.`)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* FLIGHT COMPARATIVE */
        <div className="space-y-6 animate-fade-in text-xs">
          {/* Flight comparison form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-indigo-600" />
              Compare Flight Durations vs Prices
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-600 font-semibold block mb-1.5">From (Departure)</label>
                <input 
                  type="text" 
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1.5">To (Arrival Sweden)</label>
                <input 
                  type="text" 
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1.5">Class</label>
                <select 
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="economy">Economy Class</option>
                  <option value="premium">Premium Economy</option>
                  <option value="business">Business Class</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1.5">Max Stops</label>
                <select 
                  value={flightStops}
                  onChange={(e) => setFlightStops(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                >
                  <option value="any">Any Stops</option>
                  <option value="0">Direct flights only</option>
                  <option value="1">Max 1 stop</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparative Matrix table - comparing Duration vs Price */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-800">Flight Route Alternatives Overview</h4>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">Updated Real-Time</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest text-[9px] bg-slate-50/50">
                    <th className="p-4">Airline</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Stops</th>
                    <th className="p-4">Class</th>
                    <th className="p-4 text-right">Price (SEK)</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFlights.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No flight offerings found for your selected hubs.
                      </td>
                    </tr>
                  ) : (
                    filteredFlights.map((flight) => {
                      const speedRatio = parseInt(flight.duration) / flight.price;
                      return (
                        <tr key={flight.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-base">✈️</span>
                            {flight.airline}
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {flight.from} <ArrowRight className="w-3.5 h-3.5 inline mx-1 text-slate-400" /> {flight.to}
                          </td>
                          <td className="p-4 font-bold text-slate-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {flight.duration}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              flight.stops === 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}
                            </span>
                          </td>
                          <td className="p-4 capitalize text-slate-500 font-medium">{flightClass}</td>
                          <td className="p-4 font-bold text-indigo-600 text-right">{flight.price} SEK</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => alert(`Direct link to ${flight.airline} reservation portal would load securely.`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
