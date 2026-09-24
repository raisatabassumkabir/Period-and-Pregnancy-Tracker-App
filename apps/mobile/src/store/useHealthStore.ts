import { create } from 'zustand';

import { EncryptedHealthStorage } from '@/lib/storage/encrypted-storage';

export type AppMode = 'pregnancy' | 'cycle';

export interface SymptomEntry {
  id: string;
  name: string;
  category: 'mood' | 'physical' | 'digestive';
  icon: string;
  intensity: 'mild' | 'moderate' | 'severe';
  logged: boolean;
}

export interface KickLogEntry {
  id: string;
  timestamp: string;
  durationSeconds: number;
  count: number;
}

export interface MealEntry {
  id: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  description: string;
  calories: number;
  completed: boolean;
}

interface HealthState {
  mode: AppMode;
  currentWeek: number;
  currentDay: number;
  babySizeLabel: string;
  babyWeightGrams: number;
  babyLengthCm: number;
  dueDate: string;
  daysRemaining: number;

  // Kick Counter Session
  activeKickCount: number;
  kickSessionActive: boolean;
  kickLogs: KickLogEntry[];

  // Symptoms
  symptoms: SymptomEntry[];

  // Nutrition
  meals: MealEntry[];

  // Actions
  setMode: (mode: AppMode) => void;
  incrementKick: () => void;
  resetKickSession: () => void;
  saveKickSession: () => void;
  toggleSymptom: (id: string) => void;
  toggleMeal: (id: string) => void;
  generateNewDietPlan: () => Promise<void>;
  loadEncryptedState: () => Promise<void>;
}

const DEFAULT_SYMPTOMS: SymptomEntry[] = [
  {
    id: '1',
    name: 'Baby Kicks',
    category: 'physical',
    icon: 'Footprints',
    intensity: 'moderate',
    logged: true,
  },
  {
    id: '2',
    name: 'Nausea / Morning Sickness',
    category: 'digestive',
    icon: 'Activity',
    intensity: 'mild',
    logged: true,
  },
  {
    id: '3',
    name: 'Fatigue & Low Energy',
    category: 'physical',
    icon: 'BatteryLow',
    intensity: 'moderate',
    logged: false,
  },
  {
    id: '4',
    name: 'Lower Back Pain',
    category: 'physical',
    icon: 'ShieldAlert',
    intensity: 'mild',
    logged: true,
  },
  {
    id: '5',
    name: 'Hydration (8/8 Glasses)',
    category: 'physical',
    icon: 'Droplets',
    intensity: 'mild',
    logged: true,
  },
  {
    id: '6',
    name: 'Mood: Calm & Happy',
    category: 'mood',
    icon: 'Smile',
    intensity: 'mild',
    logged: false,
  },
];

const DEFAULT_MEALS: MealEntry[] = [
  {
    id: 'm1',
    category: 'breakfast',
    title: 'Avocado Toast with Poached Eggs & Spinach',
    description:
      'Rich in Folate (B9), Choline & Healthy Omega-3 Fats for Fetal Brain Development.',
    calories: 420,
    completed: true,
  },
  {
    id: 'm2',
    category: 'lunch',
    title: 'Grilled Salmon Quinoa Bowl with Steamed Broccoli',
    description:
      'High in Lean Protein (35g), Calcium, and Iron to support blood volume expansion.',
    calories: 580,
    completed: true,
  },
  {
    id: 'm3',
    category: 'dinner',
    title: 'Lentil & Sweet Potato Curry with Brown Rice',
    description:
      'Fiber-packed plant protein with Zinc & Vitamin C for optimal nutrient absorption.',
    calories: 510,
    completed: false,
  },
  {
    id: 'm4',
    category: 'snack',
    title: 'Greek Yogurt with Mixed Berries & Chia Seeds',
    description: 'Probiotic support for digestion + 15g Protein boost.',
    calories: 220,
    completed: false,
  },
];

export const useHealthStore = create<HealthState>((set, get) => ({
  mode: 'pregnancy',
  currentWeek: 24,
  currentDay: 3,
  babySizeLabel: 'Cantaloupe 🍈',
  babyWeightGrams: 600,
  babyLengthCm: 30,
  dueDate: 'Oct 15, 2026',
  daysRemaining: 112,

  activeKickCount: 7,
  kickSessionActive: false,
  kickLogs: [
    { id: 'k1', timestamp: 'Today, 09:30 AM', durationSeconds: 600, count: 10 },
    {
      id: 'k2',
      timestamp: 'Yesterday, 08:15 PM',
      durationSeconds: 900,
      count: 12,
    },
  ],

  symptoms: DEFAULT_SYMPTOMS,
  meals: DEFAULT_MEALS,

  setMode: (mode) => {
    set({ mode });
    EncryptedHealthStorage.setHealthData('user_mode', mode);
  },

  incrementKick: () => {
    const nextCount = get().activeKickCount + 1;
    set({ activeKickCount: nextCount, kickSessionActive: true });
  },

  resetKickSession: () => {
    set({ activeKickCount: 0, kickSessionActive: false });
  },

  saveKickSession: () => {
    const count = get().activeKickCount;
    if (count === 0) return;

    const newLog: KickLogEntry = {
      id: Date.now().toString(),
      timestamp: 'Just now',
      durationSeconds: 300,
      count,
    };

    const updatedLogs = [newLog, ...get().kickLogs];
    set({
      kickLogs: updatedLogs,
      activeKickCount: 0,
      kickSessionActive: false,
    });
    EncryptedHealthStorage.setHealthData('kick_logs', updatedLogs);
  },

  toggleSymptom: (id) => {
    const updated = get().symptoms.map((s) =>
      s.id === id ? { ...s, logged: !s.logged } : s
    );
    set({ symptoms: updated });
    EncryptedHealthStorage.setHealthData('symptoms_state', updated);
  },

  toggleMeal: (id) => {
    const updated = get().meals.map((m) =>
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    set({ meals: updated });
    EncryptedHealthStorage.setHealthData('meals_state', updated);
  },

  generateNewDietPlan: async () => {
    // Simulated API response for tailored prenatal nutrition plan
    await new Promise((resolve) => setTimeout(resolve, 800));
    const refreshedMeals = get().meals.map((m) => ({ ...m, completed: false }));
    set({ meals: refreshedMeals });
  },

  loadEncryptedState: async () => {
    const savedMode =
      await EncryptedHealthStorage.getHealthData<AppMode>('user_mode');
    const savedSymptoms =
      await EncryptedHealthStorage.getHealthData<SymptomEntry[]>(
        'symptoms_state'
      );
    const savedMeals =
      await EncryptedHealthStorage.getHealthData<MealEntry[]>('meals_state');
    const savedKickLogs =
      await EncryptedHealthStorage.getHealthData<KickLogEntry[]>('kick_logs');

    set({
      ...(savedMode ? { mode: savedMode } : {}),
      ...(savedSymptoms ? { symptoms: savedSymptoms } : {}),
      ...(savedMeals ? { meals: savedMeals } : {}),
      ...(savedKickLogs ? { kickLogs: savedKickLogs } : {}),
    });
  },
}));
