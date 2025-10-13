import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';

interface ExerciseStep {
  instruction: string;
  duration: number;
}

const BreathingPlayerScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const { exerciseId } = route.params as { exerciseId: string };

  // --- STATE MANAGEMENT ---
  const [steps, setSteps] = useState<ExerciseStep[] | null>(null);
  const [instruction, setInstruction] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- ANIMATION SETUP ---
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- DATA FETCHING (No changes here) ---
  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId) return;
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/breathing/${exerciseId}`);
        setSteps(response.data.steps);
      } catch (e) {
        setError("Could not load the exercise.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  // --- CORRECTED ANIMATION LOGIC ---
  useFocusEffect(
    useCallback(() => {
      if (!steps) return; // Don't start until steps are loaded

      // A recursive function to loop through the animation steps
      const runAnimationCycle = (index: number) => {
        const currentStep = steps[index];
        setInstruction(currentStep.instruction); // Update the instruction text

        // Determine the animation based on the instruction
        let animation;
        if (currentStep.instruction.toLowerCase() === 'inhale') {
          animation = Animated.timing(scaleAnim, { toValue: 1.5, duration: currentStep.duration * 1000, useNativeDriver: true });
        } else if (currentStep.instruction.toLowerCase() === 'exhale') {
          animation = Animated.timing(scaleAnim, { toValue: 1, duration: currentStep.duration * 1000, useNativeDriver: true });
        } else { // Handle "Hold"
          animation = Animated.delay(currentStep.duration * 1000);
        }
        
        // When the animation for the current step is done, start the next one
        animation.start(() => {
          const nextIndex = (index + 1) % steps.length;
          runAnimationCycle(nextIndex);
        });
      };

      // Start the very first animation cycle
      runAnimationCycle(0);

      // Cleanup function: Stop the animation if the user navigates away
      return () => {
        scaleAnim.stopAnimation();
        scaleAnim.setValue(1); // Reset scale for next time
      };
    }, [steps]) // This effect now ONLY re-runs if the `steps` data changes
  );

  // --- RENDER LOGIC (No changes here) ---
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator animating={true} size="large" /></View>;
  }
  if (error) {
    return <View style={styles.centered}><Text>{error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text variant="displayMedium" style={styles.instructionText}>
        {instruction}
      </Text>
      <Animated.View style={[
        styles.circle,
        { backgroundColor: theme.colors.primary, transform: [{ scale: scaleAnim }] }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instructionText: { position: 'absolute', top: '25%', fontSize: 48, fontWeight: '300' },
  circle: { width: 200, height: 200, borderRadius: 100 },
});

export default BreathingPlayerScreen;