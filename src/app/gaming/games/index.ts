import Hangman from "./Hangman";
import EmojiIdioms from "./EmojiIdioms";
export const GAMES_MAP: Record<string, React.FC> = {
  "hangman": Hangman,
  "emojiIdioms": EmojiIdioms,
};
