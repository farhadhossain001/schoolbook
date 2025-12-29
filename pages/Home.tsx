import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CLASSES } from '../constants';
import { useBooks } from '../context/BookContext';
import BookCard from '../components/BookCard';
import { Book, Compass, ChevronRight, Search, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { books, isLoading } = useBooks();

  // Trending books
  const trendingBooks = books.slice(0, 5);

  return (
    <div className="min-h-screen pb-24">
      {/* Abstract Hero Section */}
      <div className="relative bg-indigo-700 dark:bg-indigo-900 overflow-hidden rounded-b-[3rem] shadow-xl shadow-indigo-100 dark:shadow-none">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-fuchsia-500 rounded-full blur-3xl opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-24 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-600 border border-indigo-500 text-indigo-100 text-xs font-bold mb-6 tracking-wide shadow-sm">
            বিনামূল্যে শিক্ষার দুয়ার
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
             আপনার পকেটে <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                পুরো লাইব্রেরি
             </span>
          </h1>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
            প্রথম শ্রেণী থেকে দ্বাদশ শ্রেণী পর্যন্ত সকল পাঠ্যবই এখন হাতের মুঠোয়। 
            সহজে খুঁজুন, পড়ুন এবং শিখুন।
          </p>
          
          {/* Main Search Action */}
          <div className="max-w-xl mx-auto">
             <div 
                className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-2xl shadow-indigo-900/20 flex items-center transform transition-transform hover:scale-[1.02] cursor-text"
                onClick={() => navigate('/search')}
             >
                <div className="pl-6 flex-grow text-left">
                   <p className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-1 mb-0.5">কি পড়তে চান?</p>
                   <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm">গণিত, বিজ্ঞান, ইতিহাস...</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full transition-colors shadow-lg">
                  <Search size={22} />
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-12">
        
        {/* Categories Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700 mb-12">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Compass size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">শ্রেণী নির্বাচন করুন</h2>
           </div>

           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-3 md:gap-4">
              {CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => navigate(`/class/${cls.value}`)}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-50/50 dark:group-hover:from-indigo-900/20 group-hover:to-indigo-100/50 dark:group-hover:to-indigo-800/20 transition-all duration-500" />
                  <span className="relative text-2xl font-black text-slate-300 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 mb-1">
                    {cls.value}
                  </span>
                  <span className="relative text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white">
                    {cls.label}
                  </span>
                </button>
              ))}
           </div>
        </div>

        {/* Trending Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-500">
                 <Book size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">জনপ্রিয় বইসমূহ</h2>
            </div>
            <button 
              onClick={() => navigate('/search')}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 py-2 px-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              সব দেখুন <ChevronRight size={16} />
            </button>
          </div>

          {isLoading ? (
             <div className="flex justify-center py-10">
               <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {trendingBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;