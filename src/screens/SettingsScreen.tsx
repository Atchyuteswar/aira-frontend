// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, Animated } from "react-native";
import {
  SegmentedButtons,
  Text,
  useTheme,
  Button,
  Divider,
  TextInput,
  Surface,
} from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { setTheme } from "../store/themeSlice";
import { signOut, setUserName } from "../store/authSlice";
import * as SecureStore from "expo-secure-store";
import apiClient from "../api/client";

const SettingsScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  // --- THIS IS THE FIX ---
  // Use separate selectors for each piece of state
  const currentTheme = useSelector((state: RootState) => state.theme.theme);
  const userName = useSelector((state: RootState) => state.auth.name);
  // -----------------------

  const [nameInput, setNameInput] = useState(userName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    setNameInput(userName || "");
  }, [userName]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            await SecureStore.deleteItemAsync("userToken");
            dispatch(signOut());
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert("Validation", "Please enter a name.");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put("/users/me", { name: nameInput });
      dispatch(setUserName(nameInput));
      Alert.alert("Success", "Your name has been updated.");
    } catch (error) {
      Alert.alert("Error", "Could not update your name.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[{ opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Settings
          </Text>
          <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.outline }]}>
            Personalize your experience
          </Text>
        </View>

        {/* Theme Section */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.label, { color: theme.colors.onBackground }]}>
              🌙 Theme
            </Text>
            <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.outline }]}>
              Choose your preferred appearance
            </Text>
          </View>
          <SegmentedButtons
            value={currentTheme}
            onValueChange={(value) => dispatch(setTheme(value as any))}
            buttons={[
              { value: "light", label: "Light", icon: "weather-sunny" },
              { value: "dark", label: "Dark", icon: "weather-night" },
              { value: "system", label: "System", icon: "cog" },
            ]}
            style={styles.segmentedButtons}
          />
        </Surface>

        {/* Profile Section */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.label, { color: theme.colors.onBackground }]}>
              👤 Profile
            </Text>
            <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.outline }]}>
              Update your personal information
            </Text>
          </View>
          <TextInput
            label="Your Name"
            value={nameInput}
            onChangeText={setNameInput}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account-circle" />}
          />
          <Button
            mode="contained"
            onPress={handleSaveName}
            loading={isSaving}
            disabled={isSaving || nameInput === userName || !nameInput.trim()}
            style={styles.saveButton}
            labelStyle={styles.buttonLabel}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Surface>

        {/* Account Section */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.label, { color: theme.colors.error }]}>
              🔐 Account
            </Text>
            <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.outline }]}>
              Manage your account security
            </Text>
          </View>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleSignOut}
            textColor={theme.colors.onError}
            buttonColor={theme.colors.error}
            style={styles.signOutButton}
            labelStyle={styles.buttonLabel}
          >
            Sign Out
          </Button>
        </Surface>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.outline }]}>
            Version 0.5
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginTop: 4,
  },
  segmentedButtons: {
    marginVertical: 12,
  },
  input: {
    marginBottom: 16,
    borderRadius: 12,
  },
  saveButton: {
    paddingVertical: 6,
    borderRadius: 12,
  },
  signOutButton: {
    paddingVertical: 6,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
  },
  footerText: {
    fontWeight: "500",
  },
});

export default SettingsScreen;
