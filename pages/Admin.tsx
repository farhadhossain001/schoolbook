import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Settings, 
  Plus, 
  Link as LinkIcon, 
  Lock, 
  LogOut, 
  Database, 
  UploadCloud, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  Hammer,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { getApiUrl, setApiUrl, addBookToSheet, updateBookInSheet, deleteBookFromSheet, getAdminPassword, resetAndSeedDatabase } from '../services/api';
import { useBooks } from '../context/BookContext';
import { Book } from '../types';
import { CLASSES, MOCK_BOOKS, ADMISSION_CATEGORIES } from '../constants';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { books, refreshBooks, isUsingLive } = useBooks();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Config State
  const [scriptUrl, setScriptUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialFormState: Partial<Book> = {
    title: '',
    subject: '',
    classLevel: '10',
    subCategory: '',
    thumbnailUrl: '',
    pdfUrl: '',
    description: ''
  };
  const [formData, setFormData] = useState<Partial<Book>>(initialFormState);

  // Filter books for display with defensive coding
  const filteredBooks = books.filter(b => {
    const q = searchTerm.toLowerCase();
    const title = b.title ? String(b.title).toLowerCase() : '';
    const subject = b.subject ? String(b.subject).toLowerCase() : '';
    const id = b.id ? String(b.id) : '';
    
    return title.includes(q) || subject.includes(q) || id.includes(q);
  });

  useEffect(() => {
    setScriptUrl(getApiUrl());
    // Auto-open settings if no URL is set
    if (!getApiUrl()) setShowSettings(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (passwordInput === getAdminPassword()) {
      setIsAuthenticated(true);
    } else {
      setLoginError('ভুল পাসওয়ার্ড দেওয়া হয়েছে। আবার চেষ্টা করুন।');
      // Clear password field on error
      setPasswordInput('');
    }
  };

  const handleConfigSave = () => {
    let cleanUrl = scriptUrl;
    if (cleanUrl.includes('/exec')) {
      cleanUrl = cleanUrl.split('/exec')[0] + '/exec';
    }
    setApiUrl(cleanUrl);
    setScriptUrl(cleanUrl);
    setMessage({ type: 'success', text: 'সেটিংস আপডেট করা হয়েছে।' });
    setTimeout(() => {
       window.location.reload();
    }, 1000);
  };

  const populateForm = (book: Book) => {
    setEditingId(book.id);
    setFormData({
      title: book.title,
      subject: book.subject,
      classLevel: book.classLevel,
      subCategory: book.subCategory || '',
      thumbnailUrl: book.thumbnailUrl,
      pdfUrl: book.pdfUrl,
      description: book.description || ''
    });
    // Scroll to top on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMessage({ type: 'info', text: `এডিট মোড: "${book.title}"` });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      setMessage({ type: 'error', text: 'সেটিংস থেকে API URL সেট করুন।' });
      setShowSettings(true);
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: 'info', text: 'অপেক্ষা করুন...' });

    // Ensure we default to 'textbook' if empty, to match what the user sees in dropdown
    const defaultSubCat = 'textbook';

    const bookData: Book = {
      id: editingId || Date.now().toString(),
      title: formData.title!,
      subject: formData.subject!,
      classLevel: formData.classLevel!,
      // Logic: If admission, use the form value or default. If not admission, force empty.
      subCategory: formData.classLevel === 'admission' ? (formData.subCategory || defaultSubCat) : '',
      thumbnailUrl: formData.thumbnailUrl || 'https://placehold.co/300x400?text=No+Cover',
      pdfUrl: formData.pdfUrl!,
      description: formData.description
    };

    let success = false;
    
    if (editingId) {
      success = await updateBookInSheet(bookData);
    } else {
      success = await addBookToSheet(bookData);
    }
    
    if (success) {
      setMessage({ type: 'success', text: 'সফলভাবে পাঠানো হয়েছে! রিফ্রেশ হচ্ছে...' });
      setFormData(initialFormState);
      setEditingId(null);
      
      setTimeout(async () => {
        await refreshBooks();
        setMessage(null);
      }, 2500);
    } else {
      setMessage({ type: 'error', text: 'সমস্যা হয়েছে। নেটওয়ার্ক চেক করুন।' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`সতর্কতা: "${title}" বইটি স্থায়ীভাবে মুছে ফেলা হবে।`)) return;
    
    setMessage({ type: 'info', text: 'মুছে ফেলা হচ্ছে...' });
    const success = await deleteBookFromSheet(id);
    
    if (success) {
      setMessage({ type: 'success', text: 'বই মুছে ফেলা হয়েছে। রিফ্রেশ হচ্ছে...' });
      setTimeout(async () => {
        await refreshBooks();
        setMessage(null);
      }, 2500);
    } else {
      setMessage({ type: 'error', text: 'মুছে ফেলতে সমস্যা হয়েছে।' });
    }
  };

  const handleResetAndFix = async () => {
    if (!scriptUrl) {
       setMessage({ type: 'error', text: 'সেটিংস ঠিক নেই।' });
       setShowSettings(true);
       return;
    }
    
    const confirmMsg = "সাবধান! এটি আপনার বর্তমান গুগল শিটের সব ডাটা মুছে ফেলবে এবং নতুন স্ট্রাকচার তৈরি করে ডেমো ডাটা আপলোড করবে। এটি করলে শিটের কলামগুলো ঠিক হয়ে যাবে। আপনি কি নিশ্চিত?";
    if (!window.confirm(confirmMsg)) return;

    setIsSyncing(true);
    setMessage({ type: 'info', text: 'ডাটাবেস ফিক্স করা হচ্ছে...' });
    
    // Prepare mock books with correct structure to seed
    const booksToSeed = MOCK_BOOKS.map((b, i) => ({
      ...b,
      id: (Date.now() + i).toString(),
      // Ensure admission books have a valid subCategory ID
      subCategory: b.classLevel === 'admission' ? (b.subCategory || 'concept') : ''
    }));

    const success = await resetAndSeedDatabase(booksToSeed);

    setIsSyncing(false);
    if (success) {
      setMessage({ type: 'success', text: 'ডাটাবেস ফিক্স করা হয়েছে! রিফ্রেশ হচ্ছে...' });
      setTimeout(() => {
        refreshBooks();
        window.location.reload();
      }, 3000);
    } else {
      setMessage({ type: 'error', text: 'ফিক্স করা সম্ভব হয়নি।' });
    }
  };

  const handleManualRefresh = async () => {
     setMessage({ type: 'info', text: 'ডাটা রিফ্রেশ হচ্ছে...' });
     await refreshBooks();
     setMessage(null);
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-10">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 mb-4 transform rotate-3">
                  <ShieldCheck size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">এডমিন প্যানেল</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">সুরক্ষিত এলাকায় প্রবেশ করুন</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if(loginError) setLoginError('');
                      }}
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border ${loginError ? 'border-red-300 dark:border-red-800 focus:ring-red-200 dark:focus:ring-red-900/30' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500'} rounded-xl focus:ring-4 outline-none transition-all text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400`}
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl text-sm font-bold animate-in slide-in-from-top-2 fade-in">
                    <AlertCircle size={18} className="shrink-0" />
                    {loginError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
                >
                  <span>লগইন করুন</span>
                  <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <button 
                  onClick={() => navigate('/')} 
                  className="text-sm font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  ওয়েবসাইটে ফিরে যান
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-100/50 dark:bg-slate-950 pb-20 font-sans">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">ড্যাশবোর্ড</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ম্যানেজমেন্ট প্যানেল</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleManualRefresh} 
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all active:scale-95" 
              title="Refresh Data"
            >
               <RefreshCw size={20} className={message?.text.includes('রিফ্রেশ') ? 'animate-spin' : ''} />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={() => setIsAuthenticated(false)} 
              className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all text-sm font-bold"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">মোট বই</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{books.length}</span>
              <BookOpen size={20} className="text-indigo-200 dark:text-indigo-900 mb-1" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">স্টেটাস</span>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${isUsingLive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className={`text-sm font-bold ${isUsingLive ? 'text-green-600' : 'text-amber-600'}`}>
                {isUsingLive ? 'লাইভ ডাটা' : 'অফলাইন/ডেমো'}
              </span>
            </div>
          </div>

           {/* Quick Action: Settings Toggle */}
           <div 
             onClick={() => setShowSettings(!showSettings)}
             className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${showSettings ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
           >
             <span className={`text-xs font-bold uppercase ${showSettings ? 'text-indigo-200' : 'text-slate-400'}`}>সেটিংস</span>
             <div className="flex items-end justify-between mt-2">
               <span className={`text-sm font-bold ${showSettings ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>API কনফিগারেশন</span>
               <Settings size={20} className={showSettings ? 'text-white' : 'text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'} />
             </div>
           </div>

           {/* Quick Action: Reset & Fix */}
           <button 
             onClick={handleResetAndFix}
             disabled={isSyncing}
             className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex flex-col justify-between text-left group"
           >
             <span className="text-xs font-bold text-slate-400 uppercase group-hover:text-red-600 dark:group-hover:text-red-400">জরুরি</span>
             <div className="flex items-end justify-between mt-2">
               <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400">ডাটাবেস ফিক্স করুন</span>
               {isSyncing ? <Loader2 size={20} className="animate-spin text-red-600" /> : <Hammer size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-red-600 dark:group-hover:text-red-400" />}
             </div>
           </button>
        </div>

        {/* Collapsible Settings Panel */}
        {showSettings && (
          <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl p-6 text-white shadow-xl animate-in slide-in-from-top-4 duration-300 border dark:border-slate-700">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><LinkIcon size={18} /> Google Apps Script URL</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
             </div>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <input 
                    type="text" 
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-sm font-mono focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none text-slate-300 placeholder:text-slate-600"
                  />
                  <p className="text-xs text-slate-400 mt-2">Apps Script Deployment URL দিন। অবশ্যই 'Anyone' পারমিশন থাকতে হবে।</p>
                </div>
                <button 
                  onClick={handleConfigSave}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold transition-colors whitespace-nowrap"
                >
                  সেভ করুন
                </button>
             </div>
          </div>
        )}

        {/* Main Content Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Editor Form (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 sticky top-24 transition-all duration-300 ${editingId ? 'border-orange-200 ring-4 ring-orange-50 dark:ring-orange-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   {editingId ? <Edit2 size={20} className="text-orange-500" /> : <Plus size={20} className="text-indigo-600 dark:text-indigo-400" />}
                   {editingId ? 'বই সম্পাদন' : 'নতুন বই যুক্ত করুন'}
                 </h2>
                 {editingId && (
                   <button onClick={cancelEdit} className="text-xs bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full font-bold hover:bg-red-100 transition">
                     বাতিল
                   </button>
                 )}
               </div>

               {message && (
                 <div className={`p-4 rounded-xl mb-6 text-sm flex items-start gap-3 ${
                   message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                   message.type === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                   'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                 }`}>
                   {message.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : 
                    message.type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : 
                    <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin" />}
                   <span className="font-medium">{message.text}</span>
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">বইয়ের নাম</label>
                   <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-slate-800 dark:text-slate-100 font-medium" placeholder="উদাহরণ: গণিত" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">বিষয়</label>
                      <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-sm dark:text-slate-100" placeholder="বিজ্ঞান" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">শ্রেণী</label>
                      <div className="relative">
                        <select value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-sm appearance-none cursor-pointer dark:text-slate-100">
                          {CLASSES.map(c => <option key={c.id} value={c.value}>{c.label}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                 </div>

                 {/* Admission Sub-Category Dropdown */}
                 {formData.classLevel === 'admission' && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide ml-1">বইয়ের ধরণ (Admission)</label>
                       <div className="relative">
                         <select 
                           value={formData.subCategory || 'textbook'} 
                           onChange={e => setFormData({...formData, subCategory: e.target.value})} 
                           className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-sm font-bold text-indigo-700 dark:text-indigo-300 appearance-none cursor-pointer"
                         >
                           {/* Allow ALL categories including textbook */}
                           {ADMISSION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                         </select>
                         <ChevronDown size={14} className="absolute right-3 top-3.5 text-indigo-400 pointer-events-none" />
                       </div>
                    </div>
                 )}

                 <div className="space-y-1">
                   <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Google Drive PDF Link</label>
                   <input required type="url" value={formData.pdfUrl} onChange={e => setFormData({...formData, pdfUrl: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-xs font-mono text-slate-600 dark:text-slate-300" placeholder="https://drive.google.com/..." />
                 </div>

                 <div className="space-y-1">
                   <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Cover Image URL (Optional)</label>
                   <input type="url" value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-xs font-mono text-slate-600 dark:text-slate-300" />
                 </div>

                 <div className="space-y-1">
                   <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">বিবরণ</label>
                   <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all text-sm resize-none dark:text-slate-100" placeholder="বই সম্পর্কে কিছু লিখুন..." />
                 </div>

                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}
                 >
                   {isSubmitting ? (
                     <><Loader2 size={20} className="animate-spin" /> প্রক্রিয়াধীন...</>
                   ) : editingId ? (
                     <><Save size={20} /> আপডেট করুন</>
                   ) : (
                     <><Plus size={20} /> সেভ করুন</>
                   )}
                 </button>
               </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Book List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
             {/* List Header & Search */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg pl-2">বইয়ের তালিকা</h2>
                   <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs font-bold">{filteredBooks.length}</span>
                </div>
                <div className="relative w-full sm:w-64">
                   <input 
                     type="text" 
                     placeholder="খুঁজুন..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm transition-all dark:text-slate-100"
                   />
                   <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
             </div>

             {/* List Content */}
             <div className="grid grid-cols-1 gap-3">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className={`group bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all flex gap-4 items-center ${editingId === book.id ? 'border-orange-300 bg-orange-50/30 dark:bg-orange-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                    >
                      {/* Thumbnail */}
                      <div className="h-16 w-12 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden flex-shrink-0 relative shadow-sm">
                        <img src={book.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                           <div>
                             <h3 className={`font-bold text-sm truncate pr-2 ${editingId === book.id ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'}`}>
                               {book.title}
                             </h3>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">শ্রেণী {book.classLevel}</span>
                               <span className="text-[10px] text-slate-400 dark:text-slate-600">•</span>
                               <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{book.subject}</span>
                               {book.subCategory && (
                                 <>
                                   <span className="text-[10px] text-slate-400 dark:text-slate-600">•</span>
                                   <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">
                                      {ADMISSION_CATEGORIES.find(c => c.id === book.subCategory)?.label || book.subCategory}
                                   </span>
                                 </>
                               )}
                             </div>
                           </div>
                           
                           {/* Actions */}
                           <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => populateForm(book)}
                                className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                title="এডিট করুন"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(book.id, book.title)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-400 dark:text-slate-500 font-medium">কোনো বই পাওয়া যায়নি</p>
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-2 hover:underline">ফিল্টার ক্লিয়ার করুন</button>}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;