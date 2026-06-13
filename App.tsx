
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, History, BookOpen, ExternalLink, Video, Mic, 
  FileText, AlertCircle, Loader2, Share2, 
  Clock, X, ChevronLeft, Moon, Sun, Camera, Square, Quote, Sparkles, Info, CheckCircle2, Library, Trash2, 
  Cpu, Palette, Rocket, Users, ArrowRight, Home
} from 'lucide-react';
import { fetchArchiveRecords } from './geminiService';
import { ArchiveRecord, SearchResult } from './types';
import html2canvas from 'html2canvas';

type ViewState = 'search' | 'library' | 'about';

interface HistoryItem {
  term: string;
  data: SearchResult;
  timestamp: number;
}

const toPersianDigits = (n: number | string | undefined): string => {
  if (n === undefined || n === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

const formatTimestamp = (ts: string | undefined): string => {
  if (!ts) return '';
  if (ts.includes(':')) {
    const parts = ts.split(':');
    return `${toPersianDigits(parts[0])}:${toPersianDigits(parts[1])}`;
  }
  return toPersianDigits(ts);
};

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [researchLibrary, setResearchLibrary] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('search');
  const [darkMode, setDarkMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedLibrary = localStorage.getItem('researchLibrary');
    if (savedLibrary) setResearchLibrary(JSON.parse(savedLibrary));
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (loading) {
      setThinkingTime(0);
      timerRef.current = window.setInterval(() => setThinkingTime(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  const saveToLibrary = (term: string, data: SearchResult) => {
    setResearchLibrary(prev => {
      const filtered = prev.filter(item => item.term !== term);
      const newLibrary = [{ term, data, timestamp: Date.now() }, ...filtered].slice(0, 50);
      localStorage.setItem('researchLibrary', JSON.stringify(newLibrary));
      return newLibrary;
    });
  };

  const removeFromLibrary = (term: string) => {
    setResearchLibrary(prev => {
      const newLibrary = prev.filter(item => item.term !== term);
      localStorage.setItem('researchLibrary', JSON.stringify(newLibrary));
      return newLibrary;
    });
  };

  const clearLibrary = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید کل تاریخچه پژوهش‌ها را پاک کنید؟')) {
      setResearchLibrary([]);
      localStorage.removeItem('researchLibrary');
    }
  };

  const handleStop = () => {
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const loadFromLibrary = (item: HistoryItem) => {
    setResults(item.data);
    setKeyword(item.term);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = useCallback(async (searchQuery?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = searchQuery || keyword;
    if (!term.trim()) return;

    const cached = researchLibrary.find(item => item.term.trim() === term.trim());
    if (cached) {
      loadFromLibrary(cached);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setCurrentView('search');
    setKeyword(term);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const data = await fetchArchiveRecords(term);
      setResults(data);
      saveToLibrary(term, data);
    } catch (err: any) {
      if (err.name !== 'AbortError') setError('خطا در واکاوی آرشیو. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [keyword, researchLibrary]);

  return (
    <div className={`min-h-screen flex flex-col items-center py-6 px-4 transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f8f9fa] text-zinc-900'}`}>
      
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 left-6 p-3 rounded-2xl shadow-xl border z-50 hover:scale-110 transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-amber-400' : 'bg-white border-zinc-200 text-zinc-500 shadow-zinc-200/50'
        }`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <header className="w-full max-w-4xl mb-8 relative">
        <div 
          onClick={() => setCurrentView('search')}
          className={`w-full h-44 overflow-hidden rounded-[2rem] mb-6 shadow-2xl relative cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] bg-black`}
        >
          <img 
            src="input_file_0.png" 
            className="absolute inset-0 w-full h-full object-cover object-top opacity-100" 
            alt="Header Background" 
          />
          {/* Gradient to darken the right side for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/30 to-transparent"></div>
          
          <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-center z-10 p-8 text-right max-w-[60%]">
            <h1 className="text-xl md:text-2xl font-black mb-1 text-white drop-shadow-lg">آرشیویاب هوشمند</h1>
            <p className="text-xs md:text-sm font-medium text-white/70 leading-relaxed">جستجوی تخصصی در اندیشه‌های رهبر معظم انقلاب</p>
          </div>
        </div>
      </header>

      {currentView === 'search' && (
        <div className="w-full max-w-2xl sticky top-4 z-20 mb-12">
          <form onSubmit={(e) => handleSearch(undefined, e)} className="relative group">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="چیزی بپرس یا جستجو کن..."
              className={`w-full h-16 px-6 pr-14 pl-28 text-lg border-2 rounded-3xl shadow-2xl transition-all outline-none ${
                darkMode ? 'bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#007a37]' : 'bg-white text-zinc-900 border-zinc-200 focus:border-[#007a37] shadow-zinc-200/40'
              }`}
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-[#007a37] transition-colors" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {keyword && (
                <button
                  type="button"
                  onClick={loading ? handleStop : () => setKeyword('')}
                  className={`p-2 rounded-xl transition-all ${loading ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {loading ? <Square size={18} fill="currentColor" /> : <X size={20} />}
                </button>
              )}
              <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'}`}></div>
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  loading ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-[#007a37] hover:bg-[#00662e] text-white'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'یافتن'}
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="w-full max-w-4xl space-y-12 min-h-[50vh]">
        {currentView === 'search' && (
          <>
            {!results && !loading && !error && (
              <WelcomeSection darkMode={darkMode} onSelectTopic={(t) => handleSearch(t)} />
            )}

            {error && (
              <div className={`border-r-4 border-red-500 p-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${darkMode ? 'bg-red-900/10 text-red-400' : 'bg-red-50 text-red-700'}`}>
                <AlertCircle size={24} /> 
                <span className="font-bold">{error}</span>
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-28 space-y-8">
                <div className="relative">
                  <div className={`w-24 h-24 border-4 rounded-full ${darkMode ? 'border-zinc-800' : 'border-emerald-100'}`}></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-[#007a37] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-4">
                  <p className="text-[#007a37] font-black text-3xl animate-pulse">واکاوی هوشمند آرشیو...</p>
                  <p className="text-zinc-400 text-lg">تحلیل و سنتز داده‌ها در {toPersianDigits(thinkingTime)} ثانیه</p>
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <SummaryCard summary={results.summary} keyword={keyword} darkMode={darkMode} />
                <div className={`flex items-center justify-between border-b-2 pb-5 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <h2 className="text-2xl font-bold dark:text-zinc-200 flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                      <BookOpen className="w-6 h-6 text-[#007a37]" />
                    </div>
                    اسناد و بیانات یافت شده
                  </h2>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
                    {toPersianDigits(results.records.length)} رکورد
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {results.records.map((record, idx) => (
                    <RecordCard key={record.id} record={record} index={idx + 1} darkMode={darkMode} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'library' && (
          <LibraryPage 
            library={researchLibrary} 
            darkMode={darkMode} 
            onSelect={loadFromLibrary} 
            onRemove={removeFromLibrary}
            onClearAll={clearLibrary}
            onBack={() => setCurrentView('search')} 
          />
        )}

        {currentView === 'about' && (
          <AboutPage darkMode={darkMode} onBack={() => setCurrentView('search')} />
        )}
      </main>

      <footer className={`w-full max-w-4xl mt-24 pt-12 pb-24 border-t flex flex-col items-center gap-10 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <button 
            onClick={() => setCurrentView('search')}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all active:scale-95 border-2 shadow-xl ${
              currentView === 'search'
                ? 'bg-[#007a37] text-white border-transparent' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-[#007a37]'
            }`}
          >
            <Home size={24} />
            <span className="text-lg">صفحه اصلی</span>
          </button>

          <button 
            onClick={() => setCurrentView('library')}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all active:scale-95 border-2 shadow-xl ${
              currentView === 'library'
                ? 'bg-[#007a37] text-white border-transparent' 
                : 'bg-white dark:bg-zinc-900 text-[#007a37] border-emerald-50 dark:border-emerald-900/20 hover:border-[#007a37]'
            }`}
          >
            <Library size={24} />
            <span className="text-lg">کتابخانه</span>
            {researchLibrary.length > 0 && (
              <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold ${currentView === 'library' ? 'bg-white text-[#007a37]' : 'bg-[#007a37] text-white'}`}>
                {toPersianDigits(researchLibrary.length)}
              </span>
            )}
          </button>

          <button 
            onClick={() => setCurrentView('about')}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all active:scale-95 border-2 shadow-xl ${
              currentView === 'about'
                ? 'bg-[#007a37] text-white border-transparent' 
                : 'bg-white dark:bg-zinc-900 text-amber-600 border-amber-50 dark:border-amber-900/20 hover:border-amber-500'
            }`}
          >
            <span className="text-lg">راهنمای سامانه</span>
            <Info size={24} />
          </button>
        </div>

        <div className="text-center opacity-40 space-y-2">
          <p className="text-base font-black">© {toPersianDigits('1403')} آرشیویاب هوشمند khamenei.ir</p>
          <p className="text-sm">پژوهش حرفه‌ای در بیانات به کمک هوش مصنوعی</p>
        </div>
      </footer>
    </div>
  );
};

// Welcome Section Component - GEN Z THEMED
const WelcomeSection: React.FC<{ darkMode: boolean; onSelectTopic: (t: string) => void }> = ({ darkMode, onSelectTopic }) => {
  const examples = [
    { title: "هوش مصنوعی و آینده", icon: <Cpu />, color: "bg-indigo-600", desc: "نظر آقا درباره AI و تکنولوژی‌های جدید چیه؟" },
    { title: "هنر، رسانه و گیم", icon: <Palette />, color: "bg-pink-600", desc: "چالش‌های هنر مدرن و رسانه از دیدگاه رهبری" },
    { title: "موفقیت و خودسازی", icon: <Rocket />, color: "bg-amber-500", desc: "چطوری توی جوونی مسیر موفقیت رو پیدا کنیم؟" },
    { title: "کنشگری و مطالبه‌گری", icon: <Users />, color: "bg-cyan-600", desc: "روش درست مطالبه‌گری دانشجوها از مسئولین" },
  ];

  return (
    <div className="w-full space-y-16 animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[#007a37] font-bold text-sm mb-4">
          <Sparkles size={16} />
          <span>پژوهش هوشمند در ثانیه</span>
        </div>
        <h3 className="text-3xl font-black dark:text-zinc-200">عبارات پژوهشی پیشنهادی (مثال)</h3>
        <p className="opacity-60 text-lg">برای شروع، یکی از موضوعات زیر را انتخاب کنید یا خودتان بنویسید</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {examples.map((ex, i) => (
          <button 
            key={i} 
            onClick={() => onSelectTopic(ex.desc)}
            className={`p-10 rounded-[3rem] border-2 text-right transition-all hover:scale-[1.04] group relative overflow-hidden flex flex-col gap-6 ${
              darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-[#007a37]' : 'bg-white border-zinc-100 hover:border-[#007a37] shadow-2xl'
            }`}
          >
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl ${ex.color}`}>
              {React.cloneElement(ex.icon as React.ReactElement<any>, { size: 32 })}
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-2xl group-hover:text-[#007a37] transition-colors">{ex.title}</h4>
              <p className="text-base opacity-70 leading-relaxed font-medium">«{ex.desc}»</p>
            </div>
            <div className="absolute left-8 bottom-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 text-[#007a37]">
              <ArrowRight size={32} />
            </div>
          </button>
        ))}
      </div>

      <div className={`p-12 rounded-[3.5rem] border-2 flex flex-col md:flex-row items-center gap-10 ${darkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100 shadow-xl'}`}>
        <div className="bg-[#007a37] p-6 rounded-[2rem] text-white shadow-2xl shrink-0">
          <Info size={48} />
        </div>
        <div className="space-y-3 text-right">
          <h4 className="font-black text-2xl text-[#007a37]">چرا از این سامانه استفاده کنیم؟</h4>
          <p className="text-lg opacity-80 leading-relaxed font-medium">
            آرشیویاب هوشمند برخلاف موتورهای جستجوی معمولی، بیانات را «می‌فهمد» و به جای لیست کردن کلمات، یک تحلیل جامع و اسناد صوتی/تصویری مرتبط را استخراج می‌کند.
          </p>
        </div>
      </div>
    </div>
  );
};

// Library Page Component
const LibraryPage: React.FC<{ 
  library: HistoryItem[]; 
  darkMode: boolean; 
  onSelect: (item: HistoryItem) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
  onBack: () => void;
}> = ({ library, darkMode, onSelect, onRemove, onClearAll, onBack }) => {
  const [filter, setFilter] = useState('');
  const filtered = library.filter(item => item.term.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-left-6 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>
            <ChevronLeft size={32} className="rotate-180" />
          </button>
          <h2 className="text-4xl font-black flex items-center gap-4 text-[#007a37]">
            <Library size={44} /> کتابخانه پژوهش‌ها
          </h2>
        </div>
        {library.length > 0 && (
          <button 
            onClick={onClearAll}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
          >
            <Trash2 size={20} />
            پاک‌سازی کل تاریخچه
          </button>
        )}
      </div>

      <div className="relative">
        <input 
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="جستجو در تاریخچه پژوهش‌ها..."
          className={`w-full h-14 px-12 rounded-2xl border-2 transition-all outline-none ${darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-[#007a37]' : 'bg-white border-zinc-100 focus:border-[#007a37]'}`}
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
      </div>
      
      {library.length === 0 ? (
        <div className="text-center py-32 opacity-20">
           <History size={100} className="mx-auto mb-8" />
           <p className="text-3xl font-black">هنوز پژوهشی انجام نداده‌اید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item, i) => (
            <div 
              key={i} 
              onClick={() => onSelect(item)}
              className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group ${
                darkMode ? 'bg-zinc-800/50 border-zinc-700 hover:border-[#007a37]' : 'bg-white border-zinc-100 hover:border-[#007a37] hover:shadow-2xl'
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="font-black text-xl">{item.term}</span>
                <span className="text-sm opacity-50 flex items-center gap-2">
                  <Clock size={16} /> {toPersianDigits(new Date(item.timestamp).toLocaleDateString('fa-IR'))}
                </span>
                <span className="text-sm text-[#007a37] font-bold mt-2">
                  {toPersianDigits(item.data.records.length)} سند تاریخی استخراج شده
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.term); }}
                className="p-4 text-red-500/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
              >
                <Trash2 size={24} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20 opacity-30 font-bold">موردی با این عبارت یافت نشد.</div>
          )}
        </div>
      )}
    </div>
  );
};

// About Page Component
const AboutPage: React.FC<{ darkMode: boolean; onBack: () => void }> = ({ darkMode, onBack }) => {
  const features = [
    { title: "درک هوشمند مفاهیم", desc: "سامانه به جای تطبیق کلمات، معنای پژوهش شما را می‌فهمد و مرتبط‌ترین اسناد را می‌یابد." },
    { title: "سنتز و روایت‌گری", desc: "خلاصه دیدگاه‌های رهبری در قالب یک روایت منسجم و استوری‌ساز ارائه می‌شود." },
    { title: "جستجوی چندرسانه‌ای", desc: "دسترسی مستقیم به ویدیوها، صوت‌ها و متن کامل بیانات از دهه ۵۰ تا امروز." },
    { title: "حریم خصوصی و سرعت", desc: "تمام تاریخچه پژوهش شما فقط در مرورگر خودتان ذخیره شده و امنیت کاملی دارد." }
  ];

  return (
    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-6 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>
          <ChevronLeft size={32} className="rotate-180" />
        </button>
        <h2 className="text-4xl font-black flex items-center gap-4 text-[#007a37]">
          <Sparkles className="text-amber-500" size={44} /> راهنمای آرشیویاب هوشمند
        </h2>
      </div>

      <div className={`p-12 rounded-[3.5rem] border-2 space-y-8 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}>
        <p className="text-2xl leading-relaxed opacity-80 font-bold">
          این سامانه با استفاده از مدل‌های زبانی پیشرفته و ابزار Google Search Grounding، آرشیو عظیم farsi.khamenei.ir را واکاوی می‌کند تا دقیق‌ترین پاسخ‌ها را برای پژوهشگران فراهم آورد.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {features.map((f, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] border-2 flex gap-6 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-emerald-50/30 border-emerald-100'}`}>
              <CheckCircle2 className="text-[#007a37] shrink-0 mt-1" size={32} />
              <div>
                <h4 className="font-black text-2xl mb-2">{f.title}</h4>
                <p className="text-lg opacity-70 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t flex flex-col items-center gap-6">
          <p className="text-lg opacity-50 font-bold">توسعه یافته برای تسهیل پژوهش‌های تاریخی و اندیشه‌ای</p>
          <div className="flex gap-4">
             <div className="px-6 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-bold">v2.1.0</div>
             <div className="px-6 py-2 rounded-full bg-[#007a37] text-white text-sm font-bold">Live API enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{ summary: any; keyword: string; darkMode: boolean }> = ({ summary, keyword, darkMode }) => {
  const storyRef = useRef<HTMLDivElement>(null);

  const handleShare = () => {
    const text = `📊 روایت کلی دیدگاه رهبری درباره «${keyword}»\n\n💡 ${summary.narrative}\n\n🔍 جستجو در آرشیویاب هوشمند khamenei.ir`;
    if (navigator.share) navigator.share({ title: `روایت ${keyword}`, text }).catch(() => {});
    else { navigator.clipboard.writeText(text); alert('متن روایت کپی شد.'); }
  };

  const handleSaveImage = async () => {
    if (!storyRef.current) return;
    try {
      const canvas = await html2canvas(storyRef.current, { scale: 3, useCORS: true, backgroundColor: '#007a37' });
      const link = document.createElement('a');
      link.download = `narrative-${keyword}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden border-2 transition-all duration-500 ${darkMode ? 'bg-[#007a37] text-white border-transparent' : 'bg-emerald-50 text-emerald-950 border-emerald-100'}`}>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-[1.5rem] backdrop-blur-md ${darkMode ? 'bg-white/10' : 'bg-white shadow-lg'}`}>
              <Sparkles size={36} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black">روایت و نگاه راهبردی</h2>
              <p className="text-lg opacity-70">سنتز دیدگاه‌ها درباره «{keyword}»</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handleShare} className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-emerald-100 shadow-lg'}`}>
               <Share2 size={28} className={darkMode ? 'text-white' : 'text-emerald-700'} />
             </button>
             <button onClick={handleSaveImage} className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-emerald-100 shadow-lg'}`}>
               <Camera size={28} className={darkMode ? 'text-white' : 'text-emerald-700'} />
             </button>
          </div>
        </div>

        <div className={`backdrop-blur-2xl p-10 rounded-[3rem] border transition-colors ${darkMode ? 'bg-white/10 border-white/10 shadow-inner' : 'bg-white border-emerald-100 shadow-2xl'}`}>
           <Quote size={56} className={`mb-6 opacity-20 ${darkMode ? 'text-white' : 'text-emerald-900'}`} />
           <p className="text-3xl font-black leading-relaxed italic text-right">«{summary.narrative}»</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {summary.keyPoints.map((point: string, i: number) => (
             <div key={i} className={`p-7 rounded-[2rem] border-2 flex items-start gap-5 transition-all hover:scale-105 ${darkMode ? 'bg-black/10 border-white/5' : 'bg-white/60 border-emerald-100 shadow-lg'}`}>
                <span className="text-emerald-600 dark:text-amber-400 font-black text-3xl">{toPersianDigits(i+1)}</span>
                <p className="text-base font-black leading-relaxed">{point}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="fixed left-[-9999px]">
        <div ref={storyRef} className="w-[1080px] h-[1920px] bg-[#007a37] flex flex-col p-24 text-white relative overflow-hidden" dir="rtl">
          <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-8 mb-32 z-10">
            <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md"><Sparkles size={60} className="text-amber-300" /></div>
            <div>
              <h4 className="text-5xl font-black opacity-90">روایت راهبردی</h4>
              <h4 className="text-4xl opacity-70 font-light">موضوع: {keyword}</h4>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-16 z-10">
            <div className="bg-white p-20 rounded-[5rem] text-[#007a37] shadow-2xl relative">
              <Quote size={120} className="opacity-10 absolute top-10 right-10" />
              <p className={`font-black leading-[1.5] text-center italic ${summary.narrative.length > 200 ? 'text-[42px]' : 'text-[58px]'}`}>«{summary.narrative}»</p>
            </div>
            <div className="space-y-8 mt-10">
              {summary.keyPoints.map((p: string, i: number) => (
                <div key={i} className="bg-white/10 p-10 rounded-[3rem] border border-white/20 flex items-center gap-8 backdrop-blur-md">
                   <div className="text-8xl font-black text-amber-300 opacity-50">{toPersianDigits(i+1)}</div>
                   <p className="text-5xl font-bold leading-tight">{p}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pb-20 pt-20 flex flex-col items-center gap-8 z-10 border-t border-white/20">
            <p className="text-5xl font-bold opacity-90">آرشیویاب هوشمند farsi.khamenei.ir</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Record Card Component
const RecordCard: React.FC<{ record: ArchiveRecord; index: number; darkMode: boolean }> = ({ record, index, darkMode }) => {
  const storyRef = useRef<HTMLDivElement>(null);
  const hasVideo = record.mediaStatus.includes('فیلم');
  const hasAudio = record.mediaStatus.includes('صوت');

  const handleSaveStory = async () => {
    if (!storyRef.current) return;
    try {
      const canvas = await html2canvas(storyRef.current, { scale: 3, useCORS: true, backgroundColor: '#007a37' });
      const link = document.createElement('a');
      link.download = `rec-${index}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`rounded-[3.5rem] p-12 shadow-2xl transition-all relative overflow-hidden border-2 ${
      darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'
    }`}>
      <div className={`absolute top-10 bottom-10 right-0 w-3 rounded-l-full transition-colors ${darkMode ? 'bg-[#007a37]/50' : 'bg-[#007a37]'}`}></div>
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full text-base font-bold shadow-lg ${darkMode ? 'text-zinc-300 bg-zinc-800' : 'text-zinc-500 bg-[#f1f3f4]'}`}>
            <span>{toPersianDigits(record.date)}</span>
            <History size={20} />
          </div>
          <div className="flex items-center gap-3">
            {record.timestamp && (
              <div className={`flex items-center gap-3 font-bold px-6 py-3 rounded-full text-sm shadow-lg ${darkMode ? 'text-emerald-400 bg-emerald-900/40' : 'text-[#007a37] bg-[#e6f4ea]'}`}>
                <span>{formatTimestamp(record.timestamp)}</span>
                <Clock size={20} />
              </div>
            )}
            <span className={`px-6 py-3 rounded-full text-sm font-black shadow-lg bg-[#007a37] text-white`}>
              سند {toPersianDigits(index)}
            </span>
          </div>
        </div>

        <h3 className={`text-3xl font-black mb-12 leading-tight transition-colors text-right ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{record.title}</h3>
        <div className={`p-10 rounded-[3rem] mb-12 border-2 relative overflow-hidden ${darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-[#fcfcfc] border-zinc-50 shadow-inner'}`}>
          <Quote className={`absolute top-6 right-10 opacity-5 ${darkMode ? 'text-white' : 'text-[#007a37]'}`} size={160} />
          <p className={`leading-[2] italic text-2xl pr-8 font-black relative z-10 text-right ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>«{record.keySentence}»</p>
        </div>

        <div className="mt-auto flex flex-col lg:flex-row items-center justify-between gap-8 pt-12 border-t-2 dark:border-zinc-800 border-zinc-100">
          <div className="flex items-center gap-5">
            <a href={record.searchLink} target="_blank" className="px-10 py-4.5 rounded-[1.5rem] text-lg font-black flex items-center gap-4 transition-all shadow-2xl active:scale-95 bg-[#007a37] text-white hover:bg-[#00662e]">
              مشاهده منبع اصلی
              <ExternalLink size={24} />
            </a>
            <button onClick={handleSaveStory} className={`p-4 rounded-2xl transition-all border-2 ${darkMode ? 'text-zinc-400 border-zinc-800 hover:bg-zinc-800' : 'text-zinc-400 border-zinc-200 hover:bg-zinc-50 hover:border-[#007a37]'}`}>
              <Camera size={28} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {hasAudio && (
              <a href={record.searchLink} target="_blank" className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 border-2 transition-all bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40`}>
                صوت <Mic size={20} />
              </a>
            )}
            {hasVideo && (
              <a href={record.searchLink} target="_blank" className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 border-2 transition-all bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40`}>
                ویدیو <Video size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="fixed left-[-9999px]">
        <div ref={storyRef} className="w-[1080px] h-[1920px] bg-[#007a37] flex flex-col p-24 text-white relative overflow-hidden" dir="rtl">
          <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-8 mb-32 z-10">
            <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md"><BookOpen size={60} /></div>
            <div><h4 className="text-5xl font-black opacity-90">آرشیویاب هوشمند</h4><h4 className="text-4xl font-light">khamenei.ir</h4></div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-16 z-10">
            <div className="space-y-8">
              <span className="text-4xl font-bold bg-white/20 px-8 py-3 rounded-full">{toPersianDigits(record.date)}</span>
              <h2 className="text-[90px] font-black leading-tight drop-shadow-2xl">{record.title}</h2>
            </div>
            <div className="bg-white p-20 rounded-[5rem] text-[#007a37] shadow-2xl relative mt-10">
              <p className="text-[64px] font-black leading-[1.5] text-center italic">«{record.keySentence}»</p>
            </div>
          </div>
          <div className="mt-auto pb-20 pt-20 flex flex-col items-center gap-8 z-10 border-t border-white/20">
            <p className="text-5xl font-bold opacity-90">آرشیویاب هوشمند farsi.khamenei.ir</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
