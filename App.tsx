
import React, { useState, useEffect, useRef } from 'react';
import { WordCategory, QuranWord } from './types';
import { geminiService } from './services/geminiService';
import { Flashcard } from './components/Flashcard';
import { VerbConjugationModal } from './components/VerbConjugationModal';
import { STATIC_VOCABULARY } from './data/vocabulary';

const App: React.FC = () => {
  const [category, setCategory] = useState<WordCategory | 'All' | null>(null);
  const [deck, setDeck] = useState<QuranWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVerb, setSelectedVerb] = useState<QuranWord | null>(null);
  
  // New State for Word Limit
  const [wordCountLimit, setWordCountLimit] = useState<number>(50);

  // Refs for timeout cleanup
  const flipTimeoutRef = useRef<number | null>(null);

  // Cleanup timeouts on unmount or category change
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    };
  }, [category]);

  const startSession = async (cat: WordCategory | 'All') => {
    // Clear any pending timeouts from previous sessions
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);

    setCategory(cat);
    setLoading(true);
    setCurrentIndex(0);
    setFlipped(false);
    setDeck([]); // Clear deck immediately to prevent stale data rendering
    
    // Simulate a brief loading for UX consistency
    setTimeout(() => {
        let finalDeck: QuranWord[] = [];
        
        // Sorting function to ensure we get the most frequent words first
        const rankSort = (a: QuranWord, b: QuranWord) => (a.frequencyRank || 9999) - (b.frequencyRank || 9999);

        if (cat === 'All') {
            // "50 most common in each category"
            const nouns = STATIC_VOCABULARY.filter(w => w.category === WordCategory.NOUN).sort(rankSort).slice(0, wordCountLimit);
            const verbs = STATIC_VOCABULARY.filter(w => w.category === WordCategory.VERB).sort(rankSort).slice(0, wordCountLimit);
            const particles = STATIC_VOCABULARY.filter(w => w.category === WordCategory.PARTICLE).sort(rankSort).slice(0, wordCountLimit);
            // Combine them
            finalDeck = [...nouns, ...verbs, ...particles];
        } else {
            // Get top N for specific category
            finalDeck = STATIC_VOCABULARY
              .filter(w => w.category === cat)
              .sort(rankSort)
              .slice(0, wordCountLimit);
        }
        
        // Shuffle the deck for study variety
        finalDeck = finalDeck.sort(() => Math.random() - 0.5);
        
        setDeck(finalDeck);
        setLoading(false);
    }, 400);
  };

  const handleNext = () => {
    setFlipped(false);
    
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);

    flipTimeoutRef.current = window.setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0); // Loop
      }
    }, 200);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      
      flipTimeoutRef.current = window.setTimeout(() => {
          setCurrentIndex(prev => prev - 1);
      }, 200);
    }
  };

  // Safe access to current word
  const currentWord = deck.length > 0 ? deck[currentIndex] : undefined;

  // Home Screen
  if (!category) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col">
        <header className="p-6 bg-white shadow-sm border-b border-sand-200">
           <div className="max-w-4xl mx-auto flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-850 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
               Q
             </div>
             <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Quranic<span className="text-emerald-600">Flash</span></h1>
           </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-emerald-950 mb-4">Master Quranic Vocabulary</h2>
            <p className="text-slate-600 max-w-lg mx-auto">
                Customize your learning session. Choose how many words to study per category, then select a topic.
            </p>
          </div>

          {/* Settings / Word Count Selection */}
          <div className="w-full max-w-lg mb-10 bg-white p-6 rounded-2xl shadow-sm border border-sand-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                Words per Category
            </h3>
            <div className="flex justify-between items-center gap-2">
                {[10, 30, 50, 100, 300].map((count) => (
                    <button
                        key={count}
                        onClick={() => setWordCountLimit(count)}
                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all border-2
                            ${wordCountLimit === count 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white'}`}
                    >
                        {count}
                    </button>
                ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
                Selecting {wordCountLimit} will load the {wordCountLimit} most frequent words for your chosen category.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
             {[
               { id: 'All', label: 'Mixed Review', icon: '🌟', desc: `~${wordCountLimit * 3} words total` },
               { id: WordCategory.NOUN, label: 'Nouns (Ism)', icon: '📖', desc: `Top ${wordCountLimit} nouns` },
               { id: WordCategory.VERB, label: 'Verbs (Fi\'l)', icon: '⚡', desc: `Top ${wordCountLimit} verbs` },
               { id: WordCategory.PARTICLE, label: 'Particles (Harf)', icon: '🔗', desc: `Top ${wordCountLimit} particles` }
             ].map((cat) => (
               <button 
                key={cat.id}
                onClick={() => startSession(cat.id as any)}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-sand-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col h-48 relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-6xl font-serif text-emerald-900">{cat.id === 'All' ? '∞' : cat.label[0]}</span>
                 </div>
                 <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 block relative z-10">{cat.icon}</span>
                 <h3 className="text-lg font-bold text-slate-800 mb-1 relative z-10">{cat.label}</h3>
                 <p className="text-xs text-slate-500 mt-auto relative z-10">{cat.desc}</p>
               </button>
             ))}
          </div>
        </main>
      </div>
    );
  }

  // Study Screen
  return (
    <div className="min-h-screen bg-sand-100 flex flex-col relative overflow-hidden">
       {/* Background decorative elements */}
       <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
       <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

       {/* Top Nav */}
       <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex justify-between items-center border-b border-sand-200 shadow-sm">
          <button onClick={() => setCategory(null)} className="text-sm font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{category === 'All' ? 'Mixed' : category}</span>
            <span className="text-[10px] text-slate-400">Top {wordCountLimit} Filter</span>
          </div>
          <div className="text-sm text-slate-400 font-mono">
            {deck.length > 0 ? currentIndex + 1 : 0} <span className="text-slate-300">/</span> {deck.length}
          </div>
       </div>

       {/* Main Card Area */}
       <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <div className="w-64 h-80 bg-sand-200 rounded-3xl"></div>
               <p className="text-emerald-800 font-medium">Preparing your deck...</p>
            </div>
          ) : deck.length > 0 && currentWord ? (
            <Flashcard 
              word={currentWord} 
              isFlipped={flipped} 
              onFlip={() => setFlipped(!flipped)}
              onOpenVerbDetails={() => setSelectedVerb(currentWord)}
            />
          ) : (
             <div className="text-center">
                <p className="text-slate-500 mb-4">No words found for this configuration.</p>
                <button onClick={() => setCategory(null)} className="text-emerald-600 font-bold hover:underline">Go Back</button>
             </div>
          )}
       </div>

       {/* Controls */}
       <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sand-100 via-sand-100/90 to-transparent flex justify-center gap-6 z-20">
          <button 
            disabled={currentIndex === 0 || deck.length === 0}
            onClick={handlePrev}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 disabled:opacity-50 text-slate-600 hover:text-emerald-600 hover:scale-105 transition active:scale-95"
            aria-label="Previous card"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <button 
             disabled={deck.length === 0}
             onClick={() => setFlipped(!flipped)}
             className="h-14 px-8 bg-emerald-850 text-white rounded-full shadow-lg hover:bg-emerald-950 font-bold tracking-wide transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {flipped ? 'Next Card' : 'Flip Card'}
          </button>

          <button 
            disabled={deck.length === 0}
            onClick={handleNext}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 text-slate-600 hover:text-emerald-600 hover:scale-105 transition active:scale-95 disabled:opacity-50"
            aria-label="Next card"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
       </div>

       {/* Modals */}
       {selectedVerb && (
         <VerbConjugationModal 
           word={selectedVerb} 
           onClose={() => setSelectedVerb(null)} 
         />
       )}
    </div>
  );
};

export default App;
