export type Role = 'admin' | 'athlete';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export interface WorkoutPlan {
  type: 'upper' | 'legs' | 'mobility';
  label: string;
  items: [string, string][]; // [id, label]
}

export type WorkoutPlanMap = Record<number, WorkoutPlan>;

export interface DailyRecordData {
  done: string[]; // exercise ids
  sleepGoal: boolean;
  bed: string; // e.g. "21:15"
  lessonTitle: string;
  lesson: string;
  note: string;
}

export type DailyRecordsMap = Record<string, DailyRecordData>;
