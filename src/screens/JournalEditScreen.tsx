// src/screens/JournalEditScreen.tsx
import React, { useState, useLayoutEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import apiClient from "../api/client";

const JournalEditScreen = ({ route, navigation }: any) => {
  const { entryId } = route.params;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [initialTitle, setInitialTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      if (entryId) {
        await apiClient.put(`/journal/${entryId}`, { title, content });
      } else {
        await apiClient.post("/journal/", { title, content });
      }
      navigation.goBack(); // This will now correctly return to the list
    } catch (error) {
      console.error("Failed to save entry", error);
      Alert.alert("Error", "Could not save the entry.");
    } finally {
      setLoading(false);
    }
  }, [entryId, title, content, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: entryId ? "Edit Entry" : "New Entry",
      headerRight: () => (
        <Button
          onPress={handleSave}
          disabled={
            loading || (title === initialTitle && content === initialContent)
          }
          style={{ marginRight: 10 }}
        >
          Save
        </Button>
      ),
    });
  }, [
    navigation,
    handleSave,
    loading,
    entryId,
    title,
    content,
    initialTitle,
    initialContent,
  ]);

  // Fetch data with a standard useEffect
  React.useEffect(() => {
    if (entryId) {
      setLoading(true);
      apiClient
        .get(`/journal/${entryId}`)
        .then((response) => {
          setTitle(response.data.title);
          setContent(response.data.content);
          setInitialTitle(response.data.title);
          setInitialContent(response.data.content);
        })
        .catch((error) => console.error("Failed to fetch entry", error))
        .finally(() => setLoading(false));
    }
  }, [entryId]);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/journal/${entryId}`);
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete entry", error);
              Alert.alert("Error", "Could not delete the entry.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={[styles.titleInput, { color: theme.colors.onSurface }]}
        placeholderTextColor={theme.colors.outline}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        selectionColor={theme.colors.primary}
      />
      <TextInput
        placeholder="Write what's on your mind..."
        value={content}
        onChangeText={setContent}
        style={[styles.contentInput, { color: theme.colors.onSurface }]}
        placeholderTextColor={theme.colors.outline}
        multiline
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        selectionColor={theme.colors.primary}
      />
      {entryId && (
        <Button
          mode="outlined"
          onPress={handleDelete}
          textColor={theme.colors.error}
          style={[
            styles.button,
            { borderColor: theme.colors.error, marginBottom: 40 },
          ]}
        >
          Delete Entry
        </Button>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  titleInput: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    marginTop: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    textAlignVertical: "top",
    marginTop: 16,
  },
  button: { marginTop: 16 },
});

export default JournalEditScreen;
