import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
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

// --- Type Definitions for Navigation ---

// Parameters for screens inside the Drawer
export type DrawerParamList = {
  Chats: undefined;
  Journal: undefined;
  BreathingList: undefined;
  Settings: undefined;
};

// Parameters for screens in the root Stack Navigator
export type RootStackParamList = {
  HomeDrawer: undefined; // This is the route for the entire drawer navigator
  Chat: { conversationId: string; title: string };
  JournalView: { entryId: string };
  JournalEdit: { entryId: string | null };
  // This is the missing piece: Define the BreathingPlayer route and its params
  BreathingPlayer: { exerciseId: string; exerciseName: string };
};

// --- Navigator Creation ---
const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// --- Drawer Navigator Component ---
const HomeDrawerNavigator = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      initialRouteName="Chats"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        drawerActiveTintColor: theme.colors.primary,
        // ... other styling ...
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
        options={{ title: "Journal Entry" }}
      />
      <Stack.Screen name="JournalEdit" component={JournalEditScreen} />
      <Stack.Screen
        name="BreathingPlayer"
        component={BreathingPlayerScreen}
        // This will now work without any TypeScript errors
        options={({ route }) => ({
          title: route.params.exerciseName,
        })}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;