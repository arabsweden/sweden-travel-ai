import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Sun, 
  CloudRain, 
  Snowflake, 
  ShoppingBag, 
  FlameKindling, 
  Ship, 
  Bus, 
  Train,
  CheckCircle2,
  Moon,
  Compass as CompassIcon,
  SunMoon
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion } from 'motion/react';

interface GuideViewProps {
  language: Language;
  defaultGuide?: 'allemansratten' | 'muslim' | 'weather' | 'cruises' | 'shopping';
  onBack: () => void;
}

export default function GuideView({
  language,
  defaultGuide = 'allemansratten',
  onBack
}: GuideViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [activeGuide, setActiveGuide] = useState<'allemansratten' | 'muslim' | 'weather' | 'cruises' | 'shopping'>(defaultGuide);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg self-start cursor-pointer"
        >
          {t.backToHome}
        </button>

        {/* Guides navigation row */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveGuide('allemansratten')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeGuide === 'allemansratten' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
          >
            🌳 Nature
          </button>
          <button
            onClick={() => setActiveGuide('muslim')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeGuide === 'muslim' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
          >
            🕌 Halal
          </button>
          <button
            onClick={() => setActiveGuide('weather')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeGuide === 'weather' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
          >
            ⛅ Weather
          </button>
          <button
            onClick={() => setActiveGuide('cruises')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeGuide === 'cruises' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
          >
            🛳️ Cruises
          </button>
          <button
            onClick={() => setActiveGuide('shopping')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeGuide === 'shopping' ? 'bg-scandi-blue text-white shadow-xs' : 'text-slate-600 hover:text-scandi-blue'
            }`}
          >
            🛍️ Shopping
          </button>
        </div>
      </div>

      {activeGuide === 'allemansratten' && (
        /* ALLEMANSRÄTTEN */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="text-3xl">🌳</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Allemansrätten (Right to Roam)</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">The Sacred Swedish Nature Freedom Code</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed text-xs">
            In Sweden, everyone has the right to roam freely in nature, pick wild berries, forage mushrooms, camp overnight, and boat on waters. This unique right comes with a strict moral duty: <strong>"Do not disturb, do not destroy."</strong> (Inte störa, inte förstöra).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4 }}
              className="p-4 bg-emerald-50 rounded-xl space-y-2 border border-emerald-100"
            >
              <h4 className="font-bold text-emerald-900 text-xs">Allowed (What you CAN do):</h4>
              <ul className="space-y-1.5 pl-4 pr-4 list-disc text-emerald-800">
                <li>Walk, cycle, ski, or ride on any land except residential plots and cultivated fields.</li>
                <li>Pitch a tent for one night on non-cultivated land without asking permission (for longer, ask the landowner).</li>
                <li>Pick wild berries, edible mushrooms, flowers, and fallen wood.</li>
                <li>Swim, boat, and anchor in any public waters.</li>
                <li>Make a small fire on soil or sand (making sure there are no forest fire bans in place).</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4 bg-red-50 rounded-xl space-y-2 border border-red-100"
            >
              <h4 className="font-bold text-red-900 text-xs">Forbidden (What you CANNOT do):</h4>
              <ul className="space-y-1.5 pl-4 pr-4 list-disc text-red-800">
                <li>Walk or camp near residential houses, gardens, or private yards.</li>
                <li>Litter! Always bring all garbage back with you.</li>
                <li>Break branches, peel bark, or pick protected flowers (like orchids).</li>
                <li>Drive motor vehicles (cars, motorcycles) off-road or on private paths with a "no entry" sign.</li>
                <li>Build fires directly on flat bare rocks (the heat cracks and destroys the rock permanently).</li>
              </ul>
            </motion.div>
          </div>
        </div>
      )}

      {activeGuide === 'muslim' && (
        /* MUSLIM TRAVEL GUIDE */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="text-3xl">🕌</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Sweden Halal & Muslim Travel Guide</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Mosques, Halal dining, & Arctic prayer solutions</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10px" }}
            transition={{ duration: 0.4 }}
            className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 space-y-3"
          >
            <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
              <SunMoon className="w-4 h-4 text-amber-600" />
              High Latitude Summer Fasting & Prayer Calculations
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              Because Sweden is situated at high latitudes, during summer (especially above the Arctic Circle in Kiruna) the sun does not set at all (Midnight Sun). In winter, daylight is extremely short. 
              According to major Islamic authorities (Fatwa committees):
            </p>
            <ul className="space-y-1 pl-4 pr-4 list-disc text-amber-950 font-medium">
              <li><strong>The Latitude Rule:</strong> You can calculate and follow prayer/fasting timings of the closest city at 45° latitude (e.g. Southern Europe) or the holy city of Mecca (Makkah).</li>
              <li>Most local Swedish mosques in Stockholm, Gothenburg, and Malmö publish adjusted summer calendars aligning with these guidelines.</li>
            </ul>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mosques */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Main Mosques & Islamic Centers:</h4>
              <div className="space-y-2">
                <motion.div 
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <h5 className="font-bold text-xs text-slate-800">Stockholm Grand Mosque (Zayed bin Sultan Al Nahyan)</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">Located in Södermalm, Kapellgränd 10. Features spacious prayer rooms and a halal cafe.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <h5 className="font-bold text-xs text-slate-800">Gothenburg Mosque</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">Located at Rambergsstaden. Provides active daily services and beautiful prayer halls.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <h5 className="font-bold text-xs text-slate-800">Malmö Islamic Center</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">One of the oldest mosques in Scandinavia, active in Malmö community.</p>
                </motion.div>
              </div>
            </div>

            {/* Dining */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Halal Dining Guide:</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                Finding halal food is very easy in Sweden's major metropolitan areas (Stockholm, Gothenburg, Malmö) due to large multicultural communities.
              </p>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100"
              >
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  • <strong>Kebab & Shawarma:</strong> Thousands of local pizzerias and kebab grills offer certified halal meat. Look for the "Halal" sign on the window.
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  • <strong>Vegetarian "Fika":</strong> All classic Swedish cafes serve vegetarian fika pastries like cinnamon buns (Kanelbulle) and princess cake (Prinsesstårta), which are entirely safe.
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  • <strong>Seafood:</strong> Fresh Baltic salmon, shrimp, and pickled herring are staple delicacies available everywhere and completely halal.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {activeGuide === 'weather' && (
        /* WEATHER ADVICE */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="text-3xl">⛅</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Sweden Seasonal Weather & Packing Guide</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Be prepared for Swedish seasons</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-2"
            >
              <h4 className="font-bold text-blue-900 text-xs flex items-center gap-1">
                <Snowflake className="w-4 h-4 text-blue-500" />
                Winter (Nov - Mar)
              </h4>
              <p className="text-blue-950 leading-relaxed">
                Temps: -5°C to -20°C. Heavy snow in north.
                <br /><strong>Wear:</strong> Layered thermal underwear, waterproof heavy winter coat, gloves, wool beanie, insulated snow boots.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="p-4 bg-green-50/50 rounded-xl border border-green-100/50 space-y-2"
            >
              <h4 className="font-bold text-green-900 text-xs flex items-center gap-1">
                <CloudRain className="w-4 h-4 text-green-500" />
                Spring & Autumn
              </h4>
              <p className="text-green-950 leading-relaxed">
                Temps: 5°C to 15°C. Unpredictable rains.
                <br /><strong>Wear:</strong> Light windbreaker, sweaters, comfortable waterproof walking shoes, compact umbrella.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.19 }}
              className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 space-y-2"
            >
              <h4 className="font-bold text-orange-900 text-xs flex items-center gap-1">
                <Sun className="w-4 h-4 text-orange-500" />
                Summer (Jun - Aug)
              </h4>
              <p className="text-orange-950 leading-relaxed">
                Temps: 18°C to 28°C. Very long days.
                <br /><strong>Wear:</strong> Sunglasses, light shirts, shorts, sun protection, light jacket for evening lake breezes.
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {activeGuide === 'cruises' && (
        /* BALTIC CRUISES */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="text-3xl">🛳️</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Baltic Sea Cruise Connections</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Ferries connecting Sweden to Finland, Visby, & Estonia</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed text-xs">
            Sweden is highly connected via premium Baltic Sea overnight passenger cruises. These offer fantastic tax-free shopping, buffet restaurants, cabins, and live entertainment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4 }}
              className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                <Ship className="w-4 h-4 text-indigo-600" />
                Stockholm ↔ Helsinki / Turku (Finland)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Operated by <strong>Tallink Silja</strong> and <strong>Viking Line</strong> daily. Departs evening, sails through the breathtaking Stockholm archipelago, and arrives morning. Recommended for archipelago views.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                <Ship className="w-4 h-4 text-indigo-600" />
                Nynäshamn ↔ Visby (Gotland Island)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Operated by <strong>Destination Gotland</strong> high-speed ferries. The voyage takes around 3 hours, offering direct summer access to the medieval walled city of Visby.
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {activeGuide === 'shopping' && (
        /* SHOPPING GUIDE */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="text-3xl">🛍️</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Swedish Shopping & Tax-Free</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Traditional Glassware, minimalist design, and saving cash</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4 }}
              className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 text-xs">What to Buy:</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                • <strong>Swedish Glassware:</strong> From the "Kingdom of Crystal" (Glasriket) like Kosta Boda.
                <br />• <strong>Design & Home:</strong> Elegant Scandinavian minimalism (Duka, Svenskt Tenn).
                <br />• <strong>Dala Horse:</strong> The hand-carved wooden red horse from Dalarna.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 text-xs">Tax-Free Shopping:</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                Non-EU tourists are eligible for a tax refund (VAT) on purchases over 200 SEK! Ask the shop assistant for a "Global Blue Tax Free Form" when making your payment, and claim your cash refund at ARN airport.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100"
            >
              <h4 className="font-bold text-slate-900 text-xs">Top Spots:</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                • <strong>NK (Nordiska Kompaniet):</strong> Premium luxury department store in Stockholm.
                <br />• <strong>Mall of Scandinavia:</strong> Massive indoor shopping center in Solna.
                <br />• <strong>Södermalm (SoFo):</strong> Best spot for retro boutiques and local Swedish fashion labels.
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
