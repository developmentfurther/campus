export interface GameComponentProps {
  userId?: string;
  onExit?: () => void;
  onFinish?: (score: number) => void;
}
