import Hangman from "./Hangman";
import EmojiIdioms from "./EmojiIdioms";
import WordScramble from "./WordScramble";
export const GAMES_MAP: Record<string, React.FC> = {
  "hangman": Hangman,
  "emojiIdioms": EmojiIdioms,
  "wordScramble": WordScramble,
};
