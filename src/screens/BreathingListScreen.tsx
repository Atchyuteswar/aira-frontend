import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated, SafeAreaView, Dimensions } from 'react-native';
import { Text, ActivityIndicator, useTheme, Surface, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../api/client';

interface Exercise {
  id: string;
  name: string;
  description: string;
}

const BreathingListScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await apiClient.get<Exercise[]>('/breathing/');
        setExercises(response.data);
      } catch (e) {
        setError('Could not load exercises.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Animatable.View animation="fadeIn" duration={500} useNativeDriver={true}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            🛑 {error}
          </Text>
        </Animatable.View>
      </View>
    );
  }

  const renderExerciseCard = ({ item, index }: { item: Exercise; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 70}
      useNativeDriver={true}
    >
      <Surface
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline + '20',
          },
        ]}
        elevation={0}
      >
        <View
          style={styles.cardTouchable}
          onTouchEnd={() =>
            (navigation as any).navigate('BreathingPlayer', {
              exerciseId: item.id,
              exerciseName: item.name,
            })
          }
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                variant="titleLarge"
                style={[styles.cardTitle, { color: theme.colors.primary }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text style={styles.cardEmoji}>🧘</Text>
            </View>

            <Text
              variant="bodyMedium"
              style={[styles.cardDescription, { color: theme.colors.outline }]}
              numberOfLines={3}
            >
              {item.description}
            </Text>

            <View style={styles.cardFooter}>
              <Text
                style={[styles.tapHint, { color: theme.colors.primary }]}
              >
                Tap to start →
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerEmoji}>🌬️</Text>
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
          }}
        >
          <Animatable.View
            animation="fadeInDown"
            duration={600}
            useNativeDriver={true}
            style={styles.titleSection}
          >
            <Text
              variant="headlineLarge"
              style={[styles.screenTitle, { color: theme.colors.onBackground }]}
            >
              Breathing Exercises
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.screenSubtitle, { color: theme.colors.outline }]}
            >
              Practice mindful breathing to reduce stress and anxiety
            </Text>
          </Animatable.View>

          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderExerciseCard}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: 0,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  screenTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  cardContent: {
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: '700',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 28,
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 8,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BreathingListScreen;