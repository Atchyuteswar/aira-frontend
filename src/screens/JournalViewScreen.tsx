import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { Text, useTheme, FAB, IconButton, Surface, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native'; // Keep useFocusEffect
import apiClient from '../api/client'; // Keep apiClient
import * as Animatable from 'react-native-animatable';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  useEffect(() => {
    if (entry) {
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
    }
  }, [entry, fadeAnim, slideAnim]);

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
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={28}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            iconColor={theme.colors.onBackground}
          />
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
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
              <Surface style={[styles.contentContainer, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <View style={styles.titleSection}>
                  <Text 
                    variant="headlineLarge" 
                    style={[styles.title, { color: theme.colors.onBackground }]}
                    numberOfLines={3}
                  >
                    {entry.title}
                  </Text>
                </View>

                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline + "30" }]} />

                <View style={styles.metaSection}>
                  <Text style={[styles.date, { color: theme.colors.outline }]}>
                    📅 {dayjs(entry.createdAt).format('MMMM D, YYYY')}
                  </Text>
                  <Text style={[styles.time, { color: theme.colors.outline }]}>
                    🕐 {dayjs(entry.createdAt).format('h:mm A')}
                  </Text>
                </View>

                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline + "30" }]} />

                <View style={styles.contentSection}>
                  <Text 
                    variant="bodyLarge" 
                    style={[styles.content, { color: theme.colors.onSurface }]}
                  >
                    {entry.content}
                  </Text>
                </View>
              </Surface>
            </Animatable.View>
          </Animated.View>
        </ScrollView>

        <Animatable.View
          animation="bounceInUp"
          duration={1000}
          delay={300}
          useNativeDriver={true}
          style={styles.fabContainer}
        >
          <FAB
            icon="pencil"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            color={theme.colors.onPrimary}
            onPress={() => navigation.navigate('JournalEdit', { entryId: entry._id })}
          />
        </Animatable.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
  },
  backButton: {
    marginTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  contentContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
  },
  title: {
    fontWeight: '700',
    lineHeight: 36,
  },
  divider: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  metaSection: {
    paddingHorizontal: 24,
    gap: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    lineHeight: 28,
    fontSize: 16,
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
});

export default JournalViewScreen;