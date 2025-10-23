import React, { useState, useLayoutEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { TextInput, Button, useTheme, FAB, Portal, Text } from "react-native-paper";
import apiClient from "../api/client";
import { Audio } from 'expo-av'; // --- 1. IMPORT EXPO-AV ---
import * as Haptics from 'expo-haptics';

const JournalEditScreen = ({ route, navigation }: any) => {
  const { entryId } = route.params;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [initialTitle, setInitialTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");

  // --- 2. NEW STATE FOR VOICE RECORDING ---
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // --- 3. RECORDING LOGIC ---
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert('Permission required', 'Please grant microphone permissions in your device settings.');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start recording.');
    }
  }

  async function stopRecording() {
    if (!recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) {
      handleTranscription(uri);
    }
    setRecording(undefined);
  }

  // --- 4. TRANSCRIPTION LOGIC ---
  const handleTranscription = async (uri: string) => {
    setIsTranscribing(true);
    const formData = new FormData();
    // The filename and type are important for FastAPI to process it correctly
    formData.append('file', {
      uri,
      name: `recording-${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);

    try {
      // Use a longer timeout for file uploads
      const response = await apiClient.post('/journal/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 seconds timeout
      });
      if (response.data) {
        // Voice note was successfully created, so we just go back
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to transcribe audio', error);
      Alert.alert('Transcription Error', 'Could not process your voice note. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = useCallback(async () => {
    // (Existing save logic is unchanged)
    setLoading(true);
    try {
      if (entryId) {
        await apiClient.put(`/journal/${entryId}`, { title, content });
      } else {
        await apiClient.post("/journal/", { title, content });
      }
      navigation.goBack();
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
          disabled={loading || isRecording || isTranscribing || (title === initialTitle && content === initialContent)}
          style={{ marginRight: 10 }}
        >
          Save
        </Button>
      ),
    });
  }, [navigation, handleSave, loading, isRecording, isTranscribing, entryId, title, content, initialTitle, initialContent]);

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
    // (Existing delete logic is unchanged)
    Alert.alert("Delete Entry", "Are you sure you want to delete this journal entry?",
      [{ text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiClient.delete(`/journal/${entryId}`);
            navigation.goBack();
          } catch (error) {
            console.error("Failed to delete entry", error);
            Alert.alert("Error", "Could not delete the entry.");
          }
        },
      },
    ]);
  };

  return (
    // --- 5. WRAP IN A PARENT VIEW FOR FAB AND OVERLAY ---
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={[styles.container]}
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
          editable={!isRecording && !isTranscribing}
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
          editable={!isRecording && !isTranscribing}
        />
        {entryId && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            textColor={theme.colors.error}
            style={[styles.button, { borderColor: theme.colors.error, marginBottom: 40 }]}
            disabled={isRecording || isTranscribing}
          >
            Delete Entry
          </Button>
        )}
      </ScrollView>

      {/* --- 6. VOICE RECORDING FAB (ONLY FOR NEW ENTRIES) --- */}
      {!entryId && (
        <FAB
            icon={isRecording ? "stop" : "microphone"}
            style={[styles.fab, { backgroundColor: isRecording ? theme.colors.errorContainer : theme.colors.primary }]}
            color={isRecording ? theme.colors.onErrorContainer : theme.colors.onPrimary}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
        />
      )}

      {/* --- 7. TRANSCRIBING OVERLAY --- */}
      {isTranscribing && (
        <Portal>
            <View style={styles.overlay}>
                <ActivityIndicator size="large" />
                <Text style={styles.overlayText}>Transcribing your voice note...</Text>
            </View>
        </Portal>
      )}
    </View>
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 16,
    color: 'white',
    fontFamily: 'Inter_500Medium',
  }
});

export default JournalEditScreen;