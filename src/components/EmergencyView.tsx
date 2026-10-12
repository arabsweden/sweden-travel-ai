import React from 'react';
import { ShieldAlert, Phone, HelpCircle, HeartPulse, Landmark, Compass } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EmergencyViewProps {
  language: Language;
  onBack: () => void;
}

export default function EmergencyView({ language, onBack }: EmergencyViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  return (
    <div className="space-y-6 text-xs text-slate-700" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
        >
          {t.backToHome}
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="text-red-600 w-5 h-5 animate-pulse" />
          {t.emergency} & Safety Advice
        </h2>
      </div>

      {/* Emergency Phone Contacts Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 112 */}
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-red-600 text-white rounded-xl shadow">
            <Phone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-red-800 font-extrabold text-sm block">112 - Primary Emergency</span>
            <p className="text-red-700 leading-relaxed text-[11px]">
              Call 112 immediately for life-threatening emergencies, serious accidents, fires, or ongoing crimes. Police, ambulances, and fire departments are dispatched here.
            </p>
          </div>
        </div>

        {/* 114 14 */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-slate-800 text-white rounded-xl shadow">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-slate-800 font-extrabold text-sm block">114 14 - Police Non-Emergency</span>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Call 114 14 to report a crime that is not ongoing (e.g. lost items, past theft) or to provide tips to the police. Available 24/7.
            </p>
          </div>
        </div>

        {/* 1177 */}
        <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-teal-600 text-white rounded-xl shadow">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-teal-800 font-extrabold text-sm block">1177 - Healthcare Advice</span>
            <p className="text-teal-700 leading-relaxed text-[11px]">
              Call 1177 for medical inquiries or health concerns. Professional nurses will guide you to the nearest clinic (Vårdcentral) or emergency room (Akutmottagning).
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Passport Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Visa & Passports */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            Visa & Passport Regulations
          </h3>

          <div className="space-y-3 leading-relaxed">
            <p>
              • <strong>Schengen Agreement:</strong> Sweden is part of the Schengen Zone. Ensure your passport is valid for at least 3 months after your planned departure from Europe.
            </p>
            <p>
              • <strong>90-Day Rule:</strong> Non-EU citizens can travel inside the Schengen Zone without a visa for up to 90 days (if eligible for visa-free entry) or with a Schengen Tourist Visa.
            </p>
            <p>
              • <strong>Lost Passports:</strong> If you lose your passport, immediately report it to the local police (114 14) to obtain an official police report, then contact your country's embassy in Stockholm for an emergency document.
            </p>
          </div>
        </div>

        {/* Safety & Travel Smart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            General Safety Advice
          </h3>

          <div className="space-y-3 leading-relaxed">
            <p>
              • <strong>Low Crime Rates:</strong> Sweden is highly secure. However, be cautious of pickpockets in crowded tourist hubs like Stockholm Old Town (Gamla Stan) or major central train stations.
            </p>
            <p>
              • <strong>Winter Driving:</strong> Winter tires are legally required from December 1st to March 31st. Watch out for black ice and wildlife (moose/deer) crossings on woodland roads.
            </p>
            <p>
              • <strong>Forest Bans:</strong> During dry summer months, authorities can impose complete fire bans (Eldningsförbud). Always verify local guidelines before camping or starting barbecues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
