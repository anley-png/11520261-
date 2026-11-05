export type Screen =
  | 'home'
  | 'letters'
  | 'forms'
  | 'trace'
  | 'words'
  | 'word'
  | 'toss'
  | 'balloon'
  | 'island';

export type LetterData = [
  char: string,
  name: string,
  sound: string,
  joinsToNext: number // 0 or 1
];

export interface WordData {
  id?: string;
  indices: number[];
  word: string;
  vocalized?: string;
  meaning: string;
  amharic?: string;
  emoji: string;
  transliteration: string;
  audioId?: string;
  section?: string;
  example_of?: string;
}

export interface VoweledChar {
  c: string;
  m: string;
}

export interface VoweledWordMatch {
  k: number;
  p: VoweledChar[];
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0 to 1
}

export type IslandTheme = 'tropical' | 'desert' | 'starlight' | 'palace';
