// src/screens/JournalViewScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, useTheme, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import dayjs from 'dayjs';

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const JournalViewScreen = ({ route, navigation }: any) => {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchEntry = async () => {
    try {
      const response = await apiClient.get(`/journal/${entryId}`);
      setEntry(response.data);
    } catch (error) {
      console.error("Failed to fetch entry", error);
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect ensures the data is fresh if you go back after editing
  useFocusEffect(useCallback(() => { fetchEntry(); }, [entryId]));

  if (loading || !entry) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineLarge" style={styles.title}>{entry.title}</Text>
        <Text variant="bodySmall" style={[styles.date, { color: theme.colors.outline }]}>
          {dayjs(entry.createdAt).format('MMMM D, YYYY')}
        </Text>
        <Text variant="bodyLarge" style={[styles.content, { color: theme.colors.onBackground }]}>
          {entry.content}
        </Text>
      </ScrollView>
      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('JournalEdit', { entryId: entry._id })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loader: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  date: {
    marginBottom: 24,
  },
  content: {
    fontSize: 17,
    lineHeight: 28, // Add extra line spacing for readability
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default JournalViewScreen;