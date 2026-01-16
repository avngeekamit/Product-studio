
import React, { useState, useEffect } from 'react';
import { ProductDetails, GeneratedPrompts, AppState } from './types';
import { generatePrompts, generateImage, generateVideo } from './geminiService';
import { Button } from './components/Button';
import { MediaCard } from './components/MediaCard';

const App: React.FC = () => {
  const [product, setProduct] = useState<ProductDetails>({ name: '', description: '' });
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null);
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [media, setMedia] = useState<{ image?: string; video?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [videoStatusText, setVideoStatusText] = useState('Waiting...');

  const handleCreatePrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || !product.description) return;

    setStatus(AppState.GENERATING_PROMPTS);
    setError(null);
    try {
      const result = await generatePrompts(product.name, product.description);
      setPrompts(result);
      setStatus(AppState.PROMPTS_READY);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompts');
      setStatus(AppState.ERROR);
    }
  };

  const handleGenerateMedia = async () => {
    if (!prompts) return;

    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }

    setStatus(AppState.GENERATING_MEDIA);
    setError(null);
    setVideoStatusText('Contacting Media Engine...');

    const videoProcess = (async () => {
      try {
        const videoPhrases = [
          'Calibrating studio lighting...',
          'Setting up camera gimbal...',
          'Rendering volumetric rays...',
          'Simulating fluid dynamics...',
          'Finalizing high-res export...',
          'Optimizing bitrate...'
        ];
        let i = 0;
        const interval = setInterval(() => {
          setVideoStatusText(videoPhrases[i % videoPhrases.length]);
          i++;
        }, 8000);

        const url = await generateVideo(prompts.videoPrompt);
        clearInterval(interval);
        setMedia(prev => ({ ...prev, video: url }));
      } catch (err: any) {
        console.error('Video Error:', err);
        setVideoStatusText('Video production encountered an error.');
        if (err.message?.includes('entity was not found')) {
          setError("API Key configuration error. Please re-select your key.");
          await window.aistudio.openSelectKey();
        }
      }
    })();

    const imageProcess = (async () => {
      try {
        const url = await generateImage(prompts.imagePrompt);
        setMedia(prev => ({ ...prev, image: url }));
      } catch (err: any) {
        console.error('Image Error:', err);
      }
    })();

    await Promise.allSettled([videoProcess, imageProcess]);
    setStatus(AppState.COMPLETED);
  };

  const reset = () => {
    setProduct({ name: '', description: '' });
    setPrompts(null);
    setMedia({});
    setStatus(AppState.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-500/30">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              MediaAgent<span className="text-cyan-400">.ai</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Studio Grade Assets</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Billing Docs
          </a>
          <Button variant="outline" onClick={() => window.aistudio.openSelectKey()} className="text-xs py-1.5 px-4 h-9">
            Setup API Key
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-16 px-6 space-y-16">
        {/* Step 1: Input */}
        <section className="max-w-xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-white">Create your showcase.</h2>
            <p className="text-slate-400 text-lg">Input your product details and let the agent engineer the perfect studio environment.</p>
          </div>

          <form onSubmit={handleCreatePrompts} className="glass p-10 rounded-[2.5rem] shadow-2xl space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Product Identity</label>
              <input 
                type="text" 
                placeholder="e.g. Lunar X1 Wireless Earbuds"
                className="w-full bg-slate-900/80 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-100"
                value={product.name}
                onChange={e => setProduct({...product, name: e.target.value})}
                disabled={status !== AppState.IDLE && status !== AppState.ERROR}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Visual Vision</label>
              <textarea 
                rows={3}
                placeholder="Describe the aesthetic, textures, and intended vibe (e.g. minimalist white, cyberpunk neon, natural wood)..."
                className="w-full bg-slate-900/80 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none text-slate-100"
                value={product.description}
                onChange={e => setProduct({...product, description: e.target.value})}
                disabled={status !== AppState.IDLE && status !== AppState.ERROR}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg rounded-2xl shadow-cyan-500/10" 
              isLoading={status === AppState.GENERATING_PROMPTS}
              disabled={!product.name || !product.description || status !== AppState.IDLE && status !== AppState.ERROR}
            >
              Analyze & Engineer Prompts
            </Button>
          </form>
        </section>

        {/* Step 2: Prompts */}
        {(prompts || status === AppState.GENERATING_PROMPTS) && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-3xl space-y-4 border-l-4 border-blue-500/50">
                <div className="flex items-center gap-3 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <h4 className="font-bold text-xs uppercase tracking-widest">Image Engineering</h4>
                </div>
                <div className="bg-slate-950/40 p-5 rounded-2xl text-sm text-slate-300 leading-relaxed min-h-[120px] font-mono">
                  {status === AppState.GENERATING_PROMPTS ? (
                    <div className="space-y-3">
                      <div className="h-3 bg-white/5 rounded-full w-full animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-[90%] animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-[80%] animate-pulse"></div>
                    </div>
                  ) : prompts?.imagePrompt}
                </div>
              </div>

              <div className="glass p-8 rounded-3xl space-y-4 border-l-4 border-cyan-500/50">
                <div className="flex items-center gap-3 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <h4 className="font-bold text-xs uppercase tracking-widest">Video Engineering</h4>
                </div>
                <div className="bg-slate-950/40 p-5 rounded-2xl text-sm text-slate-300 leading-relaxed min-h-[120px] font-mono">
                  {status === AppState.GENERATING_PROMPTS ? (
                    <div className="space-y-3">
                      <div className="h-3 bg-white/5 rounded-full w-full animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-[90%] animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-[80%] animate-pulse"></div>
                    </div>
                  ) : prompts?.videoPrompt}
                </div>
              </div>
            </div>

            {status === AppState.PROMPTS_READY && (
              <div className="flex flex-col items-center gap-4 pt-6">
                <Button 
                  variant="secondary" 
                  onClick={handleGenerateMedia} 
                  className="px-16 py-5 text-xl bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-600/10"
                >
                  Render Production Assets
                </Button>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Requires Paid Project Key for Veo & Gemini 3 Pro</p>
              </div>
            )}
          </section>
        )}

        {/* Step 3: Studio Gallery */}
        {(status === AppState.GENERATING_MEDIA || status === AppState.COMPLETED) && (
          <section className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
             <div className="text-center">
                <h2 className="text-3xl font-black text-white italic">STUDIO REELS</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mt-2 rounded-full"></div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-10">
               <MediaCard 
                 title="85mm Macro Product Still" 
                 type="image" 
                 url={media.image} 
                 isLoading={!media.image && status === AppState.GENERATING_MEDIA}
               />
               <MediaCard 
                 title="Cinematic Motion Showcase" 
                 type="video" 
                 url={media.video} 
                 isLoading={!media.video && status === AppState.GENERATING_MEDIA}
                 statusText={videoStatusText}
               />
             </div>

             {status === AppState.COMPLETED && (
               <div className="flex justify-center pt-8">
                 <Button variant="outline" onClick={reset} className="px-8 rounded-xl border-white/5 hover:bg-white/5">
                   New Studio Project
                 </Button>
               </div>
             )}
          </section>
        )}

        {error && (
          <div className="max-w-md mx-auto p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p>{error}</p>
          </div>
        )}
      </main>

      <footer className="mt-32 py-12 border-t border-white/5 text-center">
        <div className="flex justify-center gap-6 mb-4 opacity-40">
          <span className="text-[10px] font-bold tracking-widest uppercase">4K Ready</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Professional Grade</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Veo 3.1</span>
        </div>
        <p className="text-slate-600 text-xs">&copy; {new Date().getFullYear()} MediaAgent.ai Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
