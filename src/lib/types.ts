
export interface BreakActivity {
  id: string;
  name: string;
  category?: string; // e.g., "Quick Exercise", "Mindfulness", "Fun Video"
  url?: string; // Optional URL for videos, music
  duration?: number; // Optional suggested duration in minutes
}

export interface TimerSettings {
  studyDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  cyclesPerSuperBlock: number;
  dailyGoalType: 'blocks' | 'hours';
  dailyGoalValue: number;
  enableNotifications: boolean;
  strictMode: boolean; // Prevent early exit from study block
}

export interface StudySession {
  id: string;
  startTime: string; // ISO date string
  endTime?: string; // ISO date string
  durationMinutes: number;
  type: 'study' | 'short_break' | 'long_break';
  completed: boolean; // True if the full duration was completed
  topic?: string; // Optional, user-defined
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  powerMeter: number; // Could be 0-100
}

export interface PointsData {
  totalPoints: number;
  badges: string[]; // Array of badge IDs or names
}

// For "Why Am I Stuck?" AI Flow
export interface BrainStopInput {
  isTaskTooBig: boolean;
  isFeelingBored: boolean;
  isFeelingTired: boolean;
  isDistractedByThoughts: boolean;
  userDefinedMethods: string;
}

export interface BrainStopOutput {
  suggestions: string[];
}
