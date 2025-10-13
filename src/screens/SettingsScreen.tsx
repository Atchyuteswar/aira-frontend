// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  SegmentedButtons,
  Text,
  useTheme,
  Button,
  Divider,
  TextInput,
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

  useEffect(() => {
    setNameInput(userName || "");
  }, [userName]);

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync("userToken");
    dispatch(signOut());
  };

  const handleSaveName = async () => {
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="titleMedium" style={styles.label}>
        Theme
      </Text>
      <SegmentedButtons
        value={currentTheme}
        onValueChange={(value) => dispatch(setTheme(value as any))}
        buttons={[
          { value: "light", label: "Light", icon: "weather-sunny" },
          { value: "dark", label: "Dark", icon: "weather-night" },
          { value: "system", label: "System", icon: "cog" },
        ]}
      />

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.label}>
        Your Name
      </Text>
      <TextInput
        label="Name"
        value={nameInput}
        onChangeText={setNameInput}
        style={styles.input}
        mode="outlined"
      />
      <Button
        mode="contained"
        onPress={handleSaveName}
        loading={isSaving}
        disabled={isSaving || nameInput === userName}
      >
        Save Name
      </Button>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.label}>
        Account
      </Text>
      <Button
        mode="contained"
        icon="logout"
        onPress={handleSignOut}
        textColor={theme.colors.onError}
        buttonColor={theme.colors.error}
      >
        Sign Out
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { marginBottom: 12 },
  divider: { marginVertical: 24 },
  input: { marginBottom: 16 },
});

export default SettingsScreen;
