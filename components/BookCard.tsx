import React from 'react';
import { Book } from '../types';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMISSION_CATEGORIES } from '../constants';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/book/${book.id}`);
  };

  const toBanglaDigit = (str: string) => {
    return str.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  };

  const getSubCategoryLabel = () => {
    if (book.classLevel === 'admission' && book.subCategory) {
       const cat = ADMISSION_CATEGORIES.find(c => c.id === book.subCategory);
       // Return short label without emoji if possible, or just label
       return cat ? cat.label.split(' ').slice(1).join(' ') : book.subCategory;
    }
    return null;
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_10px_25px_-5px_rgba(6,81,237,0.2)] dark:shadow-none dark:border-slate-700/50 border border-slate-100 hover:border-indigo-100 dark:hover:border-indigo-500/30 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 mb-3">
        <img 
          src={book.thumbnailUrl} 
          alt={book.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute top-0 right-0 p-2 flex flex-col gap-1 items-end">
          <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/50 dark:border-slate-600">
            {book.classLevel === 'admission' ? 'ভর্তি' : `শ্রেণী ${toBanglaDigit(book.classLevel)}`}
          </span>
          {getSubCategoryLabel() && (
             <span className="bg-amber-100/90 dark:bg-amber-900/90 backdrop-blur-sm text-amber-800 dark:text-amber-200 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-white/50 dark:border-slate-600">
               {getSubCategoryLabel()}
             </span>
          )}
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow px-1">
        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          {book.subject}
        </span>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
          {book.title}
        </h3>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
             <BookOpenCheck size={14} /> 
             পড়ুন
          </span>
          <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
             <ArrowRight size={12} className="text-slate-600 dark:text-slate-300 group-hover:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;