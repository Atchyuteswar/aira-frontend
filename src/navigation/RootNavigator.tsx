import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
// --- 1. IMPORT THE ORIGINAL STACK NAVIGATOR ---
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";

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

// --- Drawer Navigator Component (Unchanged) ---
const HomeDrawerNavigator = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      initialRouteName="Chats"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        drawerActiveTintColor: theme.colors.primary,
      }}
    >
      <Drawer.Screen
        name="Chats"
        component={ConversationsListScreen}
        options={{ title: "Your Chats" }}
      />
      <Drawer.Screen
        name="BreathingList"
        component={BreathingListScreen}
        options={{ title: "Guided Breathing" }}
      />
      <Drawer.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: "My Mood Insights" }}
      />
      <Drawer.Screen
        name="Journal"
        component={JournalListScreen}
        options={{ title: "Your Journal" }}
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

// --- Main Root Navigator Component ---
const RootNavigator = () => {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
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
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="JournalView"
        component={JournalViewScreen}
        // --- 4. REMOVE CUSTOM ANIMATION OPTIONS ---
        options={{
          title: "Journal Entry",
          headerShown: false, // Keep header hidden if using custom back button
        }}
      />
      <Stack.Screen name="JournalEdit" component={JournalEditScreen} />
      <Stack.Screen
        name="BreathingPlayer"
        component={BreathingPlayerScreen}
        options={({ route }) => ({
          title: route.params.exerciseName,
        })}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;