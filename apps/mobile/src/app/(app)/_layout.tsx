import React from 'react';
import { Tabs } from 'expo-router';
import { Heart, Activity, Utensils, BookOpen, Settings } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';

export default function AppLayout() {
  const mode = useHealthStore((state) => state.mode);
  const isPregnancy = mode === 'pregnancy';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF7575',
        tabBarInactiveTintColor: '#6E6E80',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#2A2A32',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isPregnancy ? 'Timeline' : 'Cycle',
          tabBarIcon: ({ color, size }) => <Heart size={size - 2} color={color} />,
        }}
      />

      <Tabs.Screen
        name="symptoms"
        options={{
          title: isPregnancy ? 'Symptoms' : 'Logs',
          tabBarIcon: ({ color, size }) => <Activity size={size - 2} color={color} />,
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Diet Plan',
          tabBarIcon: ({ color, size }) => <Utensils size={size - 2} color={color} />,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
