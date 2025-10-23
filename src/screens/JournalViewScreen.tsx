import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Text, useTheme, FAB, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native'; // Keep useFocusEffect
import apiClient from '../api/client'; // Keep apiClient
import dayjs from 'dayjs';
// --- 1. REMOVE SHARED ELEMENT IMPORT ---
// import { SharedElement } from 'react-navigation-shared-element';
import { RootStackParamList } from '../navigation/RootNavigator'; // Keep types
import { StackScreenProps } from '@react-navigation/stack'; // Keep types

// Define the structure of the fetched Journal Entry
interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

// --- 6. UPDATE PROPS TO EXPECT entryId ---
type Props = StackScreenProps<RootStackParamList, 'JournalView'>;

const JournalViewScreen = ({ route, navigation }: Props) => {
  // --- 6. GET entryId FROM PARAMS ---
  const { entryId } = route.params;
  const theme = useTheme();

  // --- 4. ADD BACK STATE MANAGEMENT ---
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 5. ADD BACK DATA FETCHING LOGIC ---
  const fetchEntry = async () => {
    setLoading(true); // Ensure loading state is set
    try {
      const response = await apiClient.get(`/journal/${entryId}`);
      setEntry(response.data);
    } catch (error) {
      console.error("Failed to fetch entry", error);
      // Optional: Show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect ensures the data is fresh if you go back after editing
  useFocusEffect(useCallback(() => { fetchEntry(); }, [entryId]));

  // Show loader while fetching
  if (loading || !entry) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <IconButton
          icon="arrow-left"
          size={28}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          iconColor={theme.colors.onBackground}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- 2. REMOVE SHARED ELEMENT WRAPPER --- */}
          {/* <SharedElement id={`item.${entry._id}.card`} style={styles.sharedElement}> */}
          <View style={[styles.contentContainer, { backgroundColor: theme.colors.surface }]}>
            <Text variant="headlineLarge" style={styles.title}>{entry.title}</Text>
            <Text variant="bodySmall" style={[styles.date, { color: theme.colors.outline }]}>
              {dayjs(entry.createdAt).format('MMMM D, YYYY')}
            </Text>
            <Text variant="bodyLarge" style={[styles.content, { color: theme.colors.onBackground }]}>
              {entry.content}
            </Text>
          </View>
          {/* </SharedElement> */}
        </ScrollView>
        <FAB
          icon="pencil"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('JournalEdit', { entryId: entry._id })}
        />
      </SafeAreaView>
    </View>
  );
};

// --- 3. REMOVE STATIC CONFIGURATION ---
// JournalViewScreen.sharedElements = ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: { // Added loader style back
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60, // Keep padding for custom back button
  },
  // sharedElement style is no longer needed
  // sharedElement: {
  //   flex: 1,
  // },
  contentContainer: {
    flex: 1,
    padding: 24,
    borderRadius: 28, // Keep the modern border radius
  },
  title: {
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  date: {
    marginBottom: 24,
  },
  content: {
    fontSize: 17,
    lineHeight: 28,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default JournalViewScreen;