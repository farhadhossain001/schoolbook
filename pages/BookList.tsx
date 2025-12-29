import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import BookCard from '../components/BookCard';
import { ArrowLeft, BookX, Loader2, GraduationCap } from 'lucide-react';
import { ADMISSION_CATEGORIES } from '../constants';
import { Book } from '../types';

const BookList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { books, isLoading } = useBooks();
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all', 'textbook', 'highlighted', 'concept', 'question_bank'

  const isAdmission = classId === 'admission';

  const toBanglaDigit = (str: string | undefined) => {
    if (!str) return "";
    return str.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  };

  // --- STANDARD CLASS VIEW ---
  if (!isAdmission) {
    const filteredBooks = books.filter(book => book.classLevel === classId);

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[85vh]">
        <div className="flex flex-col gap-4 mb-8">
          <Link 
            to="/"
            className="self-start inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-semibold bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
          >
            <ArrowLeft size={16} className="mr-2" /> হোম পেজ
          </Link>
          
          <div className="bg-indigo-600 dark:bg-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
             <div className="relative z-10">
                <span className="opacity-80 font-medium tracking-wide text-indigo-100 uppercase text-xs mb-2 block">লাইব্রেরি কালেকশন</span>
                <h1 className="text-3xl sm:text-4xl font-black mb-2">
                  শ্রেণী {toBanglaDigit(classId)}
                </h1>
                <p className="text-indigo-100 font-medium">
                  মোট {toBanglaDigit(filteredBooks.length.toString())} টি বই পাওয়া গেছে
                </p>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
              <BookX size={64} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">কোনো বই পাওয়া যায়নি</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed">
              এই শ্রেণীর জন্য বর্তমানে কোনো পাঠ্যবই আমাদের সংগ্রহে নেই। শীঘ্রই যুক্ত করা হবে।
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              অন্যান্য শ্রেণী দেখুন
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- ADMISSION VIEW LOGIC ---

  // 1. Get all relevant books
  const admissionData = useMemo(() => {
    const subjects = new Set<string>();
    
    // Grouped Books
    const grouped: Record<string, {
      main: Book[],
      highlighted: Book[],
      concept: Book[],
      questionBank: Book[]
    }> = {};

    books.forEach(book => {
      const isClass11or12 = book.classLevel === '11' || book.classLevel === '12';
      const isAdmissionBook = book.classLevel === 'admission';

      if (isClass11or12 || isAdmissionBook) {
         const subject = book.subject;
         subjects.add(subject);

         if (!grouped[subject]) {
           grouped[subject] = { main: [], highlighted: [], concept: [], questionBank: [] };
         }

         if (isClass11or12 || (isAdmissionBook && book.subCategory === 'textbook')) {
            grouped[subject].main.push(book);
         } else if (isAdmissionBook) {
            if (book.subCategory === 'highlighted') grouped[subject].highlighted.push(book);
            else if (book.subCategory === 'concept') grouped[subject].concept.push(book);
            else if (book.subCategory === 'question_bank') grouped[subject].questionBank.push(book);
            else grouped[subject].concept.push(book); // Fallback
         }
      }
    });

    return { subjects: Array.from(subjects).sort(), grouped };
  }, [books]);

  // Set default subject if not set
  React.useEffect(() => {
    if (!activeSubject && admissionData.subjects.length > 0) {
      setActiveSubject(admissionData.subjects[0]);
    }
  }, [admissionData.subjects, activeSubject]);

  const renderSection = (title: string, books: Book[]) => {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full ml-auto">
            {books.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.length > 0 ? (
            books.map(book => <BookCard key={book.id} book={book} />)
          ) : (
            <div className="col-span-full p-6 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-sm">
              এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি।
            </div>
          )}
        </div>
      </section>
    );
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[85vh]">
      {/* Admission Header */}
      <div className="flex flex-col gap-6 mb-8">
         <Link 
          to="/"
          className="self-start inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-semibold bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
        >
          <ArrowLeft size={16} className="mr-2" /> হোম পেজ
        </Link>
        
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 rounded-[2rem] p-6 sm:p-10 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
           <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
           <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 inline-block border border-white/10">
                  College & Admission
                </span>
                <h1 className="text-3xl sm:text-5xl font-black mb-2 leading-tight">
                  কলেজ ও ভর্তি প্রস্তুতি
                </h1>
                <p className="text-indigo-100 font-medium max-w-lg">
                  একাদশ-দ্বাদশ ও বিশ্ববিদ্যালয় ভর্তির সম্পূর্ণ গাইডলাইন। মূল বই, কনসেপ্ট বুক এবং প্রশ্নব্যাংক।
                </p>
              </div>
              <GraduationCap size={64} className="text-white/20 sm:text-white/30" />
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
        </div>
      ) : admissionData.subjects.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-8">
           
           {/* Sidebar: Subjects (Desktop) / Scroll (Mobile) */}
           <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-24">
                 <h3 className="font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider mb-3 px-2">বিষয়সমূহ</h3>
                 <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 no-scrollbar">
                    {admissionData.subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => setActiveSubject(subject)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-left font-bold text-sm transition-all ${
                          activeSubject === subject 
                            ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 scale-[1.02]' 
                            : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Content Area */}
           <div className="flex-grow">
              {activeSubject && admissionData.grouped[activeSubject] && (
                <>
                  {/* Category Tabs */}
                   <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar border-b border-slate-100 dark:border-slate-700 sticky top-[72px] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur z-20 pt-2">
                     <button 
                       onClick={() => setActiveTab('all')}
                       className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                     >
                       সব দেখুন
                     </button>
                     {ADMISSION_CATEGORIES.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => setActiveTab(cat.id)}
                          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === cat.id ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                        >
                          {cat.label}
                        </button>
                     ))}
                   </div>

                   <div className="space-y-10">
                      {(activeTab === 'all' || activeTab === 'textbook') && (
                        <>
                          {renderSection('📚 মূল বই', admissionData.grouped[activeSubject].main)}
                          {activeTab === 'all' && <hr className="border-slate-200/60 dark:border-slate-800" />}
                        </>
                      )}

                      {(activeTab === 'all' || activeTab === 'highlighted') && (
                        <>
                          {renderSection('📝 দাগানো বই', admissionData.grouped[activeSubject].highlighted)}
                          {activeTab === 'all' && <hr className="border-slate-200/60 dark:border-slate-800" />}
                        </>
                      )}

                      {(activeTab === 'all' || activeTab === 'concept') && (
                         <>
                          {renderSection('💡 কনসেপ্ট বুক', admissionData.grouped[activeSubject].concept)}
                          {activeTab === 'all' && <hr className="border-slate-200/60 dark:border-slate-800" />}
                        </>
                      )}

                      {(activeTab === 'all' || activeTab === 'question_bank') && (
                        renderSection('❓ প্রশ্নব্যাংক', admissionData.grouped[activeSubject].questionBank)
                      )}
                   </div>
                </>
              )}
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
            <BookX size={64} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">কোনো কন্টেন্ট পাওয়া যায়নি</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed">
            ভর্তি প্রস্তুতির জন্য বর্তমানে কোনো বই ডাটাবেজে নেই। এডমিন প্যানেল থেকে বই যুক্ত করুন।
          </p>
        </div>
      )}
    </div>
  );
};

export default BookList;