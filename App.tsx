
import React, { useState, useEffect, useRef } from 'react';
import { AppStep, UploadedImage, LayoutMode, LanguageCode } from './types';
import { mergeImages, loadImages } from './utils/imageUtils';
import { translations, languages } from './translations';

const StepIndicator: React.FC<{ currentStep: AppStep, t: any }> = ({ currentStep, t }) => {
  const steps: AppStep[] = ['UPLOAD', 'SUBSCRIBE', 'ARRANGE', 'DOWNLOAD'];
  const stepLabels: Record<AppStep, string> = {
    UPLOAD: t.upload,
    SUBSCRIBE: t.subscribe,
    ARRANGE: t.arrange,
    DOWNLOAD: t.download
  };

  return (
    <div className="flex justify-between items-center w-full px-4 py-3 bg-white border-b border-slate-200 shrink-0">
      {steps.map((step, idx) => (
        <div key={step} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            steps.indexOf(currentStep) >= idx ? 'bg-emerald-600 text-white scale-110 shadow-md shadow-emerald-200' : 'bg-slate-200 text-slate-400'
          }`}>
            {idx + 1}
          </div>
          <span className="text-[9px] mt-1 font-bold text-slate-400 uppercase tracking-tighter">{stepLabels[step]}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<LanguageCode>('ar');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [step, setStep] = useState<AppStep>('UPLOAD');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('HORIZONTAL');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasVisitedYoutube, setHasVisitedYoutube] = useState(false);

  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[lang];

  // التعرف التلقائي على اللغة
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as any;
    if (translations[browserLang]) {
      setLang(browserLang);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length < 2 || files.length > 20) {
      setError(t.errorCount);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const newImages = files.map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
        aspectRatio: 1
      }));
      setImages(newImages);
      
      const htmlImgs = await loadImages(newImages.map(img => img.url));
      setLoadedImages(htmlImgs);
      
      setStep('SUBSCRIBE');
    } catch (err) {
      setError('Error loading images');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (step === 'ARRANGE' && loadedImages.length > 0) {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(async () => {
        const preview = await mergeImages(loadedImages, layoutMode, 10, 800);
        setPreviewImage(preview);
      }, 30); 
    }
    return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
  }, [step, layoutMode, loadedImages]);

  const handleSubscribeClick = () => {
    window.open('https://www.youtube.com/@omrsofr?sub_confirmation=1', '_blank');
    setHasVisitedYoutube(true);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const newLoaded = [...loadedImages];
    if (direction === 'left' && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      [newLoaded[index], newLoaded[index - 1]] = [newLoaded[index - 1], newLoaded[index]];
    } else if (direction === 'right' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      [newLoaded[index], newLoaded[index + 1]] = [newLoaded[index + 1], newLoaded[index]];
    }
    setImages(newImages);
    setLoadedImages(newLoaded);
  };

  const finalizeAndDownload = async () => {
    setIsProcessing(true);
    try {
      const final = await mergeImages(loadedImages, layoutMode, 10, 2500); 
      setFinalImage(final);
      setStep('DOWNLOAD');
    } catch (err) {
      setError('Finalizing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 select-none overflow-hidden font-sans text-slate-900" dir={t.dir}>
      <header className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0 shadow-lg z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5v14h16V5H4zm14 12H6V7h12v10zM7 8h10v8H7V8z"/></svg>
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase hidden sm:block">MERGEIT</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all z-50 relative ${showLangMenu ? 'bg-white text-emerald-900 shadow-xl' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <span>{languages.find(l => l.code === lang)?.flag}</span>
            <span>{languages.find(l => l.code === lang)?.name}</span>
            <svg className={`w-3 h-3 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showLangMenu && (
            <div 
              className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]" 
              onClick={() => setShowLangMenu(false)}
            ></div>
          )}

          <div className={`absolute ${t.dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-2 w-48 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-3xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top z-50 ${showLangMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {languages.map(l => (
                <button 
                  key={l.code} 
                  onClick={() => {
                    setLang(l.code as LanguageCode);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-[11px] font-bold flex items-center justify-between rounded-2xl transition-all ${lang === l.code ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                  style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left', flexDirection: t.dir === 'rtl' ? 'row-reverse' : 'row' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{l.flag}</span>
                    <span>{l.name}</span>
                  </div>
                  {lang === l.code && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[10px] bg-emerald-600 px-2 py-1 rounded font-bold uppercase tracking-widest hidden sm:block">OMRSOFR</div>
      </header>

      <StepIndicator currentStep={step} t={t} />

      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-[60] bg-red-600 text-white px-5 py-4 rounded-2xl text-xs font-bold shadow-2xl animate-in slide-in-from-top-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </span>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 p-1">×</button>
          </div>
        )}

        {step === 'UPLOAD' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-full shadow-2xl flex items-center justify-center border-8 border-emerald-50 relative overflow-hidden group">
              <svg className="h-20 w-20 sm:h-24 sm:w-24 text-emerald-500 transition-transform group-hover:scale-110 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.title}</h2>
              <p className="text-slate-400 font-medium text-sm italic">{t.subtitle}</p>
            </div>
            <label className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 sm:py-5 rounded-3xl shadow-xl shadow-emerald-100 cursor-pointer transition-all active:scale-95 text-center text-lg sm:text-xl uppercase tracking-widest">
              {t.pickImages}
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        )}

        {step === 'SUBSCRIBE' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
             <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-2xl w-full max-w-sm text-center border-t-8 border-red-600">
                <div className="text-5xl sm:text-6xl mb-4 animate-bounce">🎬</div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{t.supportChannel}</h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">{t.subscribeNote}</p>
                <div className="my-6 sm:my-8 space-y-4">
                  <button onClick={handleSubscribeClick} className="w-full bg-red-600 text-white font-black py-4 sm:py-5 rounded-3xl shadow-xl shadow-red-100 active:scale-95 transition-all text-base sm:text-lg flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    {t.subscribeBtn}
                  </button>
                  <button 
                    onClick={() => setStep('ARRANGE')}
                    className={`w-full font-black py-4 sm:py-5 rounded-3xl transition-all text-base sm:text-lg border-2 ${
                      hasVisitedYoutube 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' 
                        : 'bg-white text-slate-300 border-slate-100'
                    }`}
                  >
                    {t.continueBtn}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-50">CHANNEL: OMRSOFR</p>
             </div>
          </div>
        )}

        {step === 'ARRANGE' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
             <div className="h-[40%] bg-slate-900 flex items-center justify-center p-2 overflow-hidden border-b border-white/10 relative shrink-0">
                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full z-10 uppercase tracking-tighter shadow-lg">Live Preview</div>
                {previewImage ? (
                  <img src={previewImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-opacity duration-300" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                     <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-[9px] font-black uppercase text-slate-500">{t.processing}</span>
                  </div>
                )}
             </div>

             <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden bg-white rounded-t-[35px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] z-20 min-h-0">
                <div className="flex justify-between items-center shrink-0">
                   <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{t.layoutOptions}</h3>
                   <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                      {(['HORIZONTAL', 'VERTICAL', 'GRID'] as LayoutMode[]).map(mode => (
                        <button key={mode} onClick={() => setLayoutMode(mode)} className={`px-3 sm:px-4 py-2 rounded-xl text-[8px] sm:text-[9px] font-black transition-all ${layoutMode === mode ? 'bg-white shadow-md text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                           {mode === 'HORIZONTAL' ? t.horizontal : mode === 'VERTICAL' ? t.vertical : t.grid}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-nowrap gap-4 pb-4 custom-scrollbar snap-x min-h-0">
                   {images.map((img, idx) => (
                      <div key={img.id} className="bg-slate-50 p-3 sm:p-4 rounded-3xl flex flex-col items-center gap-2 border border-slate-100 min-w-[130px] sm:min-w-[150px] shrink-0 h-full justify-between shadow-sm snap-center group hover:border-emerald-200 transition-colors">
                         <div className="w-full flex justify-between items-center px-1">
                            <span className="text-slate-300 font-black text-[10px]">#{idx + 1}</span>
                            <div className="w-2 h-2 bg-emerald-50 rounded-full group-hover:bg-emerald-500 transition-colors"></div>
                         </div>
                         <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md">
                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex gap-2 w-full mt-1">
                            <button onClick={() => moveImage(idx, 'left')} className="flex-1 py-2 sm:py-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 disabled:opacity-20 border border-slate-100 flex items-center justify-center active:scale-90 transition-all" disabled={idx === 0}>
                               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <button onClick={() => moveImage(idx, 'right')} className="flex-1 py-2 sm:py-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 disabled:opacity-20 border border-slate-100 flex items-center justify-center active:scale-90 transition-all" disabled={idx === images.length - 1}>
                               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                         </div>
                      </div>
                   ))}
                </div>

                <button onClick={finalizeAndDownload} className="w-full bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-[28px] shadow-2xl shadow-emerald-200 active:scale-95 transition-all text-base sm:text-lg uppercase tracking-widest shrink-0">
                   {t.finalizeBtn}
                </button>
             </div>
          </div>
        )}

        {step === 'DOWNLOAD' && finalImage && (
          <div className="flex-1 flex flex-col p-4 space-y-4 min-h-0 overflow-hidden">
             <div className="flex-1 bg-white rounded-[45px] shadow-2xl flex items-center justify-center p-4 sm:p-8 border-4 border-emerald-50 overflow-hidden relative group min-h-0">
                <img src={finalImage} className="max-w-full max-h-full object-contain rounded-xl shadow-lg transition-transform group-hover:scale-105 duration-700" alt="Final Result" />
                <div className="absolute bottom-6 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">{t.ready}</div>
             </div>
             <div className="grid grid-cols-2 gap-4 sm:gap-5 shrink-0">
                <button 
                  onClick={() => {
                     const link = document.createElement('a');
                     link.download = `MERGEIT_${Date.now()}.png`;
                     link.href = finalImage;
                     link.click();
                  }}
                  className="bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-[30px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg sm:text-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  {t.download}
                </button>
                <button onClick={() => { setStep('UPLOAD'); setImages([]); setHasVisitedYoutube(false); setPreviewImage(null); }} className="bg-slate-100 text-slate-400 font-black py-4 sm:py-5 rounded-[30px] active:scale-95 transition-all text-base sm:text-xl uppercase tracking-tighter">
                  {t.newBtn}
                </button>
             </div>
          </div>
        )}
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center">
          <div className="w-16 h-16 sm:w-20 h-20 border-[6px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin shadow-2xl"></div>
          <p className="mt-6 font-black text-emerald-900 tracking-widest uppercase text-[10px] animate-pulse">{t.processing}</p>
        </div>
      )}

      <footer className="p-3 bg-white text-center border-t border-slate-100 shrink-0">
         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t.footer}</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
