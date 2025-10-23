import React from "react";
import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
// --- 1. IMPORT THE ORIGINAL STACK NAVIGATOR ---
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// --- Screen Imports ---
import ConversationsListScreen from "../screens/ConversationsListScreen";
import ChatScreen from "../screens/ChatScreen";
import JournalListScreen from "../screens/JournalListScreen";
import JournalViewScreen from "../screens/JournalViewScreen";
import JournalEditScreen from "../screens/JournalEditScreen";
import SettingsScreen from "../screens/SettingsScreen";
import BreathingListScreen from "../screens/BreathingListScreen";
import BreathingPlayerScreen from "../screens/BreathingPlayerScreen";
import InsightsScreen from "../screens/InsightsScreen";

// --- Type Definitions for Navigation ---
export type DrawerParamList = {
  Chats: undefined;
  Journal: undefined;
  BreathingList: undefined;
  Insights: undefined;
  Settings: undefined;
};

// --- 3. REVERT RootStackParamList for JournalView ---
export type RootStackParamList = {
  HomeDrawer: undefined;
  Chat: { conversationId: string; title: string };
  JournalView: { entryId: string }; // Changed back to only entryId
  JournalEdit: { entryId: string | null };
  BreathingPlayer: { exerciseId: string; exerciseName: string };
};

// --- 2. CREATE THE ORIGINAL NAVIGATOR INSTANCE ---
const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// --- Drawer Navigator Component ---
const HomeDrawerNavigator = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      initialRouteName="Chats"
      screenOptions={{
        headerStyle: { 
          backgroundColor: theme.colors.surface,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline + '10',
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: 0.3,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerActiveBackgroundColor: theme.colors.primary + '12',
        drawerLabelStyle: {
          marginLeft: -16,
          fontWeight: '600',
          fontSize: 14,
          letterSpacing: 0.1,
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          borderRightWidth: 1,
          borderRightColor: theme.colors.outline + '12',
          width: '75%',
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 8,
          marginVertical: 4,
        },
        drawerContentStyle: {
          paddingTop: 12,
        },
      }}
    >
      <Drawer.Screen
        name="Chats"
        component={ConversationsListScreen}
        options={{ 
          title: "  Your Chats",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="BreathingList"
        component={BreathingListScreen}
        options={{ 
          title: "  Guided Breathing",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="meditation" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ 
          title: "  My Mood Insights",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Journal"
        component={JournalListScreen}
        options={{ 
          title: "  Your Journal",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="notebook-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: "  Settings",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// --- Main Root Navigator Component ---
const RootNavigator = () => {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { 
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="HomeDrawer"
        component={HomeDrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ 
          title: route.params.title,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="JournalView"
        component={JournalViewScreen}
        options={{
          title: "Journal Entry",
          headerShown: false, 
        }}
      />
      <Stack.Screen 
        name="JournalEdit" 
        component={JournalEditScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BreathingPlayer"
        component={BreathingPlayerScreen}
        options={({ route }) => ({
          title: route.params.exerciseName,
          headerShown: false,
        })}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;