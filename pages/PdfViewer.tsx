import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useBooks } from '../context/BookContext';
import { getProxiedPdfUrl, getEmbedUrl } from '../constants';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Maximize,
  Minimize,
  AlertCircle,
  FileText,
  ExternalLink
} from 'lucide-react';

// Initialize PDF.js worker
const pdfJsVersion = '3.11.174';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;

const PdfViewer: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books } = useBooks();
  
  // Book Data
  const book = books.find(b => b.id === bookId);
  const proxiedUrl = book?.pdfUrl ? getProxiedPdfUrl(book.pdfUrl) : null;
  const embedUrl = book?.pdfUrl ? getEmbedUrl(book.pdfUrl) : null;

  // View Mode: 'custom' = react-pdf, 'drive' = iframe embed
  const [viewMode, setViewMode] = useState<'custom' | 'drive'>('custom');

  // PDF State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0); 
  const [rotation, setRotation] = useState<number>(0);
  
  // Loading States
  const [isDownloading, setIsDownloading] = useState<boolean>(true); 
  const [isRendering, setIsRendering] = useState<boolean>(true); 
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(window.innerWidth);
  const prevContainerWidth = useRef<number>(0);

  // Pinch Zoom State
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ dist: number; scale: number } | null>(null);

  // PDF.js Options
  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/cmaps/`,
    cMapPacked: true,
  }), []);

  // 1. Initial Checks & Fetch
  useEffect(() => {
    // If book not found or no URL, stop loading
    if (!book || !book.pdfUrl) {
      setIsDownloading(false);
      setIsRendering(false);
      setError('বইটি খুঁজে পাওয়া যায়নি অথবা পিডিএফ লিংক নেই।');
      return;
    }

    // If we can't proxy it (e.g. not a drive link), fallback immediately
    if (!proxiedUrl && viewMode === 'custom') {
       console.warn("Cannot proxy this URL, switching to Drive view");
       setViewMode('drive');
       return;
    }

    // Only fetch if in custom mode
    if (viewMode !== 'custom') return;
    
    // Reset states
    setIsDownloading(true);
    setError(null);
    setPdfBlobUrl(null);
    
    let active = true;

    const fetchPdf = async () => {
      try {
        // Fetch with a timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch(proxiedUrl!, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        const blob = await response.blob();
        
        // Basic validation that it is a PDF
        if (blob.type !== 'application/pdf' && blob.size < 1000) {
           // sometimes proxy returns HTML error page
           throw new Error('Invalid PDF content');
        }

        if (active) {
           const objectUrl = URL.createObjectURL(blob);
           setPdfBlobUrl(objectUrl);
           setIsDownloading(false);
        }
      } catch (err) {
        console.error("PDF Download/Proxy Error:", err);
        if (active) {
           // Auto-fallback to Drive Viewer on failure
           setViewMode('drive');
        }
      }
    };

    fetchPdf();

    return () => {
      active = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [proxiedUrl, book, viewMode]);


  // 2. Responsive Size Calculation
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const currentWidth = containerRef.current.clientWidth;
        if (Math.abs(currentWidth - prevContainerWidth.current) > 10) {
            // Padding logic: Mobile less padding, desktop more
            const padding = window.innerWidth < 640 ? 16 : 48;
            const newWidth = currentWidth - padding;
            setPdfWidth(newWidth);
            prevContainerWidth.current = currentWidth;
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsRendering(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("PDF Parse Error:", err);
    // Auto-fallback if parsing fails
    setViewMode('drive');
  };

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(4, s + 0.25));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.25));

  // --- Pinch Zoom ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only intercept if 2 fingers (pinch)
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent native browser zoom/pan interference during pinch
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchStartRef.current = { dist, scale };
    } else {
      touchStartRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current && contentRef.current) {
      e.preventDefault(); 
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const ratio = dist / touchStartRef.current.dist;
      // Use standard scale transform for smoothness during pinch
      contentRef.current.style.transform = `scale(${ratio})`;
      // Center transform feels best during gesture
      contentRef.current.style.transformOrigin = 'center center';
      contentRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current && contentRef.current) {
      const transform = contentRef.current.style.transform;
      const match = transform.match(/scale\((.*?)\)/);
      const ratio = match ? parseFloat(match[1]) : 1;
      
      // Reset CSS transform
      contentRef.current.style.transform = 'none';
      contentRef.current.style.transition = 'transform 0.2s ease-out';
      
      // Commit to state (react-pdf will re-render sharp)
      const newScale = touchStartRef.current.scale * ratio;
      setScale(Math.min(Math.max(0.5, newScale), 4.0));
      touchStartRef.current = null;
    }
  };

  if (!book) return null;

  // --- Drive View (Fallback) ---
  if (viewMode === 'drive') {
    return (
      <div className={`fixed inset-0 z-[100] bg-slate-900 flex flex-col ${isFullscreen ? 'h-screen' : ''}`}>
        <div className="bg-slate-800/90 backdrop-blur-md text-white px-4 py-3 flex items-center justify-between border-b border-slate-700/50 shadow-lg z-20">
          <div className="flex items-center gap-4 max-w-[70%]">
            <button onClick={() => navigate(`/book/${bookId}`)} className="p-2.5 hover:bg-slate-700/80 rounded-full flex items-center gap-2">
              <ArrowLeft size={20} className="text-slate-300" />
            </button>
            <span className="font-bold text-sm text-slate-100 truncate">{book.title}</span>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setViewMode('custom')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-500">
               <FileText size={14} /> Custom Reader
             </button>
             <button onClick={toggleFullscreen} className="p-2 bg-slate-800 rounded-lg">
               {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
             </button>
          </div>
        </div>
        
        {/* Iframe Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
           {embedUrl ? (
             <>
                <iframe 
                    src={embedUrl} 
                    className="w-full h-full border-none" 
                    allow="autoplay; fullscreen" 
                    title="Drive Viewer" 
                />
                {/* Overlay to block the Google Drive 'Pop-out' button in top-right */}
                <div className="absolute top-0 right-0 w-20 h-16 z-10 bg-transparent" aria-hidden="true" />
             </>
           ) : (
             <div className="text-white text-center p-6">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-400"/>
                <p>এই বইয়ের লিংকটি সরাসরি ভিউ করার জন্য উপযুক্ত নয়।</p>
                <a href={book.pdfUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg text-sm font-bold">
                  <ExternalLink size={16}/> ড্রাইভ এ খুলুন
                </a>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- Custom View ---
  const isLoading = isDownloading || isRendering;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col h-full overflow-hidden select-none">
      {/* Top Bar - Simplified */}
      <div className="bg-slate-900/95 backdrop-blur text-white px-3 py-2 flex items-center justify-between border-b border-slate-800 shadow-md z-30 h-14">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full shrink-0 transition-colors">
            <ArrowLeft size={20} className="text-slate-300 hover:text-white" />
          </button>
          <h1 className="font-bold text-sm text-slate-200 truncate pr-2">{book.title}</h1>
        </div>

        <div className="flex items-center justify-end gap-1 shrink-0">
           <button 
             onClick={() => setViewMode('drive')} 
             className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded-lg transition-colors" 
             title="Switch to Drive Viewer"
           >
             <FileText size={20} />
           </button>
           <button 
             onClick={toggleFullscreen} 
             className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
           >
             {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-auto bg-slate-900 relative flex"
        ref={containerRef}
        // touch-action: pan-x pan-y Allows standard browser scrolling (panning) with one finger
        // We only preventDefault when 2 fingers are detected for pinching
        style={{ touchAction: 'pan-x pan-y' }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* 
            FIX: Use 'm-auto' on the inner container instead of 'justify-center items-center' on the parent.
            This ensures content is centered when smaller than viewport, but accessible via scroll
            (expanding right/down) when larger than viewport.
        */}
        <div className="m-auto p-4 sm:p-8 w-fit min-h-full flex items-center">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 pointer-events-none bg-slate-900/50 backdrop-blur-sm">
                 <div className="relative mb-4">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                 </div>
                 <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isDownloading ? "Downloading..." : "Rendering..."}
                 </p>
                 {isDownloading && (
                   <button 
                     onClick={() => setViewMode('drive')}
                     className="mt-6 pointer-events-auto text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-full transition-colors border border-slate-700 font-semibold"
                   >
                     দেরি হচ্ছে? ড্রাইভ ভিউয়ার
                   </button>
                 )}
              </div>
            )}

            {error ? (
               <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm text-center mx-auto">
                  <AlertCircle size={48} className="text-red-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">সমস্যা হয়েছে</h3>
                  <p className="text-sm mb-6 leading-relaxed text-slate-400">{error}</p>
                  <button onClick={() => navigate(-1)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                    ফিরে যান
                  </button>
               </div>
            ) : (
              pdfBlobUrl && (
                <div 
                  ref={contentRef}
                  className={`origin-center transition-opacity duration-200 ${isRendering ? 'opacity-0' : 'opacity-100'}`}
                >
                   <Document
                      file={pdfBlobUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={null}
                      className="flex flex-col gap-4 shadow-2xl shadow-black/50"
                      options={options}
                   >
                      <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        rotate={rotation}
                        width={pdfWidth}
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        className="bg-white"
                        loading={null}
                      />
                   </Document>
                </div>
              )
            )}
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      {!isLoading && !error && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-lg z-30">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-1.5 flex items-center justify-between gap-1">
             
             {/* Zoom Section */}
             <div className="flex items-center bg-slate-900/60 rounded-xl px-1 py-0.5">
                <button 
                    onClick={handleZoomOut} 
                    className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 active:scale-95 transition-all"
                    disabled={scale <= 0.5}
                >
                    <ZoomOut size={18}/>
                </button>
                <span className="text-xs font-mono w-[3.5ch] text-center text-white font-bold">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={handleZoomIn} 
                    className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 active:scale-95 transition-all"
                    disabled={scale >= 4}
                >
                    <ZoomIn size={18}/>
                </button>
             </div>

             {/* Rotate Button */}
             <button 
                onClick={() => setRotation(r => (r + 90) % 360)} 
                className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-300 bg-slate-900/60 active:scale-95 transition-all"
                title="Rotate"
             >
                <RotateCw size={18}/>
             </button>

             {/* Pagination Section */}
             <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl px-1 py-0.5 flex-grow justify-center">
                <button 
                    onClick={() => changePage(-1)} 
                    disabled={pageNumber<=1} 
                    className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
                >
                    <ChevronLeft size={20}/>
                </button>
                <div className="flex flex-col items-center leading-none px-1">
                     <span className="text-sm font-bold text-white">{pageNumber}</span>
                     <span className="text-[10px] text-slate-500">of {numPages||'--'}</span>
                </div>
                <button 
                    onClick={() => changePage(1)} 
                    disabled={pageNumber>=numPages} 
                    className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
                >
                    <ChevronRight size={20}/>
                </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
