
export enum AIState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  TALKING = 'talking',
  HAPPY = 'happy'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student';
  joinedAt: string;
  active: boolean;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  price: number;
  isFree: boolean;
  category: string;
}

export interface Announcement {
  id: string;
  text: string;
  timestamp: Date;
}

export interface HomeworkSubmission {
  id: string;
  studentName: string;
  subject: string;
  status: 'Pending' | 'Reviewed';
  date: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  joinedDate: string;
}

export interface Resource {
  id: string;
  type: 'pdf' | 'image' | 'video';
  title: string;
  url: string;
  category: string;
}

export interface Question {
  q: string;
  options: string[];
  answer: number;
}

export interface Quiz {
  date: string;
  subject: string;
  questions: Question[];
  createdBy: string;
}

export interface QuizAttempt {
  studentName: string;
  answers: number[];
  score: number;
  total: number;
  submittedAt: string;
}

export interface QuizResult {
  userId: string;
  score: number;
  totalQuestions: number;
  date: string;
  rank?: string;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  logoUrl: string;
  aiEnabled: boolean;
  liveYoutubeId: string;
  isLive: boolean;
  liveTitle: string;
  adminUid: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
}
