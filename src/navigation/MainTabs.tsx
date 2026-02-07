import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GenerateScreen } from '../screens/GenerateScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: 28,
        height: 85,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: ({ color, size }) => {
        const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
          Generate: 'sparkles',
          History: 'film',
          Profile: 'person',
        };
        const iconName = iconMap[route.name];
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Generate" component={GenerateScreen} options={{ tabBarLabel: '生成' }} />
    <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: '歷史' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '個人' }} />
  </Tab.Navigator>
);
