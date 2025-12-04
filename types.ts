export enum WordCategory {
  NOUN = 'Noun',
  VERB = 'Verb',
  PARTICLE = 'Particle', // Conjunctions, prepositions
  ADJECTIVE = 'Adjective'
}

export interface QuranWord {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  category: WordCategory;
  rootWord?: string;
  frequencyRank?: number; // Approximate rank in top 300
  exampleAyah?: string; // Short snippet
  exampleTranslation?: string;
}

export interface VerbConjugation {
  tense: 'Past' | 'Present/Future' | 'Imperative' | 'Passive';
  arabic: string;
  transliteration: string;
  english: string;
  ayahRef?: string; // e.g., "2:183"
}

export interface VerbDetails {
  root: string;
  forms: VerbConjugation[];
  notes?: string;
}

export interface FlashcardState {
  currentCategory: WordCategory | 'All' | null;
  deck: QuranWord[];
  currentIndex: number;
  isLoading: boolean;
  flipped: boolean;
  completedIds: string[];
}