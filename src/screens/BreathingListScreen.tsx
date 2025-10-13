import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

interface Exercise {
  id: string;
  name: string;
  description: string;
}

const BreathingListScreen = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <View style={styles.centered}><ActivityIndicator animating={true} size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text>{error}</Text></View>;
  }

  return (
    <FlatList
      data={exercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <Card 
          style={styles.card}
          onPress={() => navigation.navigate('BreathingPlayer', { exerciseId: item.id, exerciseName: item.name })}
        >
          <Card.Content>
            <Title>{item.name}</Title>
            <Paragraph>{item.description}</Paragraph>
          </Card.Content>
        </Card>
      )}
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 16},
});

export default BreathingListScreen;