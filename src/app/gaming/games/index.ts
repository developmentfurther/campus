import Hangman from "./Hangman";
import EmojiIdioms from "./EmojiIdioms";
import WordScramble from "./WordScramble";
import Wordle from "./Wordle";
import SentenceBuilder from "./SentenceBuilder";
import ErrorFinder from "./ErrorFinder";
export const GAMES_MAP: Record<string, React.FC> = {
  "hangman": Hangman,
  "emojiIdioms": EmojiIdioms,
  "wordScramble": WordScramble,
  "wordle": Wordle,
  "sentenceBuilder": SentenceBuilder,
  "errorFinder": ErrorFinder,
};
