import { User } from 'firebase/auth';

export type Role = 'alumno' | 'profesor' | 'admin';

export interface AuthUser extends User {
  role?: Role;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  batchId: string;
  userKey: string;
  firstName?: string;
  lastName?: string;
  learningLanguages?: string[];
  activeLanguage?: string;
  learningLevel?: string;
  active?: boolean;
  createdAt?: string;
  cursosAdquiridos?: string[];
  progreso?: Record<string, any>;
  tutorialsSeen?: Record<string, boolean>;
  hasSeenWelcomeVideo?: boolean;
  hasSeenChatbotVideo?: boolean;
  hasSeenCoursePlayerVideo?: boolean;
  hasSeenChatbotTutorial?: boolean;
  hasSeenCoursePlayerTutorial?: boolean;
}

export interface BatchUser {
  uid: string;
  email: string;
  role: Role;
  batchId: string;
  userKey: string;
  createdAt?: string;
  cursosAdquiridos?: string[];
  progreso?: Record<string, any>;
  active?: boolean;
  learningLanguages?: string[];
  activeLanguage?: string;
  learningLevel?: string;
}

export interface UserBatch {
  users: BatchUser[];
}