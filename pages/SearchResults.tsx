import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import BookCard from '../components/BookCard';
import { ArrowLeft, SearchX, Loader2 } from 'lucide-react';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { books, isLoading } = useBooks();
  const query = searchParams.get('q') || '';

  const filteredBooks = books.filter(book => {
    if (!query) return true;
    const q = query.toLowerCase();
    
    // Defensive coding: Ensure all fields are strings
    const title = book.title ? String(book.title).toLowerCase() : '';
    const subject = book.subject ? String(book.subject).toLowerCase() : '';
    const classLevel = book.classLevel ? String(book.classLevel).toLowerCase() : '';

    return (
      title.includes(q) ||
      subject.includes(q) ||
      `class ${classLevel}`.includes(q) ||
      classLevel === q
    );
  });

  const toBanglaDigit = (num: number) => {
    return num.toString().replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[85vh]">
      <button 
        onClick={() => navigate('/')} 
        className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors text-sm font-semibold bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
      >
        <ArrowLeft size={16} className="mr-2" /> হোম-এ ফিরে যান
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">
          {query ? <span className="text-indigo-600 dark:text-indigo-400">"{query}"</span> : 'সকল বই'}
          <span className="text-slate-800 dark:text-slate-200"> এর ফলাফল</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {toBanglaDigit(filteredBooks.length)} টি বই পাওয়া গেছে
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-full mb-6">
            <SearchX size={56} className="text-red-300 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">দুঃখিত, কোনো মিল পাওয়া যায়নি</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
             বানান পরীক্ষা করুন অথবা অন্য কোনো শব্দ দিয়ে অনুসন্ধান করুন।
          </p>
          <button 
            onClick={() => document.querySelector('input')?.focus()}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;