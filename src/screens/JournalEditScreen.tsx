import React, { useState, useLayoutEffect, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, useTheme, FAB, Portal, Text, Surface, Divider, IconButton } from "react-native-paper";
import * as Animatable from 'react-native-animatable';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim]);

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={28}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            iconColor={theme.colors.onBackground}
          />
          <View style={{ flex: 1 }} />
          <Text style={styles.headerEmoji}>✍️</Text>
        </View>

        <ScrollView
          style={[styles.container]}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              useNativeDriver={true}
            >
              <Surface 
                style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]} 
                elevation={0}
              >
                <View style={styles.titleSection}>
                  <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                    📝 Entry Title
                  </Text>
                  <TextInput
                    placeholder="What's on your mind?"
                    value={title}
                    onChangeText={setTitle}
                    style={[styles.titleInput, { color: theme.colors.onSurface }]}
                    placeholderTextColor={theme.colors.outline}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    selectionColor={theme.colors.primary}
                    editable={!isRecording && !isTranscribing}
                    mode="flat"
                  />
                </View>

                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline + "20" }]} />

                <View style={styles.contentSection}>
                  <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                    💭 Your Thoughts
                  </Text>
                  <TextInput
                    placeholder="Write what's on your mind... or use the voice recorder below!"
                    value={content}
                    onChangeText={setContent}
                    style={[styles.contentInput, { color: theme.colors.onSurface }]}
                    placeholderTextColor={theme.colors.outline}
                    multiline
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    selectionColor={theme.colors.primary}
                    editable={!isRecording && !isTranscribing}
                    mode="flat"
                  />
                </View>
              </Surface>
            </Animatable.View>

            {entryId && (
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={100}
                useNativeDriver={true}
              >
                <Button
                  mode="outlined"
                  onPress={handleDelete}
                  textColor={theme.colors.error}
                  style={[styles.deleteButton, { borderColor: theme.colors.error, marginBottom: 20 }]}
                  disabled={isRecording || isTranscribing}
                >
                  🗑️ Delete Entry
                </Button>
              </Animatable.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* --- 6. VOICE RECORDING FAB (ONLY FOR NEW ENTRIES) --- */}
        {!entryId && (
          <Animatable.View
            animation="bounceInUp"
            duration={1000}
            delay={300}
            useNativeDriver={true}
            style={styles.fabContainer}
          >
            <FAB
              icon={isRecording ? "stop" : "microphone"}
              style={[
                styles.fab,
                {
                  backgroundColor: isRecording
                    ? theme.colors.errorContainer
                    : theme.colors.primary,
                },
              ]}
              color={
                isRecording
                  ? theme.colors.onErrorContainer
                  : theme.colors.onPrimary
              }
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
            />
          </Animatable.View>
        )}

        {/* --- 7. TRANSCRIBING OVERLAY --- */}
        {isTranscribing && (
          <Portal>
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={theme.colors.onPrimary} />
              <Text style={[styles.overlayText, { color: theme.colors.onPrimary }]}>
                🎙️ Transcribing your voice note...
              </Text>
            </View>
          </Portal>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  backButton: {
    margin: 0,
  },
  inputContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  divider: {
    marginHorizontal: 24,
    marginVertical: 12,
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  deleteButton: {
    marginTop: 20,
    marginHorizontal: 0,
    borderRadius: 12,
  },
  fabContainer: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  overlayText: {
    marginTop: 16,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default JournalEditScreen;