import React, { useMemo } from 'react';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../app/hooks';
import { useTheme } from '../theme';
import { AppStackParamList, AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { BootScreen } from '../screens/BootScreen';
import { InsightsScreen } from '../screens/tasks/InsightsScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppFlow() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AppStack.Screen name="TaskList" component={TaskListScreen} />
      <AppStack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <AppStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <AppStack.Screen name="Insights" component={InsightsScreen} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const status = useAppSelector((state) => state.auth.status);
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    }),
    [colors, isDark],
  );

  if (status === 'booting') {
    return <BootScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'signedIn' ? <AppFlow /> : <AuthFlow />}
    </NavigationContainer>
  );
}
