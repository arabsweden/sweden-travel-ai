import React, { useState, useEffect } from 'react';
import { 
  Building, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  UtensilsCrossed, 
  ShieldAlert, 
  ArrowLeft,
  Loader2,
  Lock,
  Compass
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

interface DashboardViewProps {
  language: Language;
  user: any;
  onBack: () => void;
}

export default function DashboardView({ language, user, onBack }: DashboardViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  
  // Access check
  const isAdmin = user && user.email === 'Raedinsweden@gmail.com';

  const [activeTab, setActiveTab] = useState<'destinations' | 'hotels' | 'restaurants'>('destinations');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [city, setCity] = useState('Stockholm');
  const [rating, setRating] = useState('4');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=600&q=80');

  // Load items from Firestore
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, activeTab));
      const res: any[] = [];
      querySnapshot.forEach((doc) => {
        res.push({ id: doc.id, ...doc.data() });
      });
      setItems(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
    }
  }, [isAdmin, activeTab]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desc) return;

    setIsSaving(true);
    try {
      const itemData: any = {
        name,
        desc,
        city,
        image,
        createdAt: new Date().toISOString()
      };

      if (activeTab === 'hotels' || activeTab === 'restaurants') {
        itemData.rating = parseInt(rating);
        itemData.price = parseInt(price) || 1200;
        itemData.location = location || 'Central';
      }

      await addDoc(collection(db, activeTab), itemData);
      
      // Reset form
      setName('');
      setDesc('');
      setPrice('');
      setLocation('');
      
      fetchItems();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, activeTab);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      fetchItems();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, activeTab);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="p-4 bg-red-50 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow border border-red-100">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-slate-500 text-xs">
          This dashboard is reserved strictly for administrative accounts. Please sign in with the verified administrator email (Raedinsweden@gmail.com).
        </p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-yellow-400 font-bold rounded-lg text-xs"
        >
          {t.backToHome}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-slate-700" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          Admin Destination & Asset Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form to create assets */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            Add New Travel Resource
          </h3>

          {/* Form Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['destinations', 'hotels', 'restaurants'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all capitalize cursor-pointer ${
                  activeTab === tab ? 'bg-slate-900 text-yellow-400' : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Resource Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                placeholder="e.g. Clarion Hotel Sign, Vasa Museum..."
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Description / Guidelines</label>
              <textarea 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none h-20"
                placeholder="Describe details, hours, facilities, accessibility features..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Swedish City</label>
                <select 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Stockholm">Stockholm</option>
                  <option value="Gothenburg">Gothenburg</option>
                  <option value="Malmö">Malmö</option>
                  <option value="Kiruna">Kiruna</option>
                  <option value="Visby">Visby</option>
                </select>
              </div>

              {(activeTab === 'hotels' || activeTab === 'restaurants') && (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Rating</label>
                  <select 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  </select>
                </div>
              )}
            </div>

            {(activeTab === 'hotels' || activeTab === 'restaurants') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Price (SEK)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Specific Location</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="Gamla Stan, Central"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Image URL</label>
              <input 
                type="text" 
                value={image} 
                onChange={(e) => setImage(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Firestore
            </button>
          </form>
        </div>

        {/* Right Column: Existing assets list */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Existing Active Assets ({items.length})</span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase">{activeTab}</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Fetching from Firestore...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-center p-12 bg-slate-50 text-slate-400 rounded-xl">No resources saved under this category yet.</p>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5 max-w-sm truncate">{item.desc}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-200 text-[9px] font-bold rounded">
                        🏙️ {item.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
