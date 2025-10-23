import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, SafeAreaView, Dimensions } from 'react-native';
import { Text, ActivityIndicator, useTheme, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../api/client';

interface ExerciseStep {
  instruction: string;
  duration: number;
}

const BreathingPlayerScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const { exerciseId } = route.params as { exerciseId: string };
  const { width } = Dimensions.get('window');

  // --- STATE MANAGEMENT ---
  const [steps, setSteps] = useState<ExerciseStep[] | null>(null);
  const [instruction, setInstruction] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // --- ANIMATION SETUP ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      // Initial fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // A recursive function to loop through the animation steps
      const runAnimationCycle = (index: number) => {
        const currentStep = steps[index];
        setInstruction(currentStep.instruction); // Update the instruction text
        setCurrentStepIndex(index);

        // Calculate progress
        const stepProgress = (index + 1) / steps.length;
        Animated.timing(new Animated.Value(progress), {
          toValue: stepProgress,
          duration: 300,
          useNativeDriver: false,
        }).start((result) => {
          if (result.finished) {
            setProgress(stepProgress);
          }
        });

        // Determine the animation based on the instruction
        let animation;
        if (currentStep.instruction.toLowerCase() === 'inhale') {
          animation = Animated.timing(scaleAnim, { 
            toValue: 1.5, 
            duration: currentStep.duration * 1000, 
            useNativeDriver: true 
          });
        } else if (currentStep.instruction.toLowerCase() === 'exhale') {
          animation = Animated.timing(scaleAnim, { 
            toValue: 1, 
            duration: currentStep.duration * 1000, 
            useNativeDriver: true 
          });
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
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Animatable.View animation="fadeIn" duration={500} useNativeDriver={true}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            🛑 {error}
          </Text>
        </Animatable.View>
      </View>
    );
  }

  const circleSize = Math.min(width * 0.6, 300);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={28}
            onPress={() => {}}
            style={styles.backButton}
            iconColor={theme.colors.onBackground}
          />
          <View style={{ flex: 1 }} />
          <Text style={styles.headerEmoji}>🧘</Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <View style={styles.contentWrapper}>
            {/* Header Info */}
            <Animatable.View
              animation="fadeInDown"
              duration={600}
              useNativeDriver={true}
              style={styles.infoSection}
            >
              <Text style={[styles.phase, { color: theme.colors.primary }]}>
                Step {currentStepIndex + 1} of {steps?.length || 0}
              </Text>
              <Surface 
                style={[styles.progressCard, { backgroundColor: theme.colors.surface }]} 
                elevation={0}
              >
                <ProgressBar 
                  progress={progress} 
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
              </Surface>
            </Animatable.View>

            {/* Main Circle Animation */}
            <View style={styles.circleWrapper}>
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={200}
                useNativeDriver={true}
              >
                <Animated.View 
                  style={[
                    styles.circle,
                    { 
                      backgroundColor: theme.colors.primary, 
                      transform: [{ scale: scaleAnim }],
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                    }
                  ]} 
                />
              </Animatable.View>
            </View>

            {/* Instruction Text */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={300}
              useNativeDriver={true}
              style={styles.instructionWrapper}
            >
              <Surface 
                style={[styles.instructionCard, { backgroundColor: theme.colors.primaryContainer }]} 
                elevation={0}
              >
                <Text 
                  variant="displaySmall" 
                  style={[styles.instructionText, { color: theme.colors.onPrimaryContainer }]}
                >
                  {instruction}
                </Text>
              </Surface>
            </Animatable.View>

            {/* Guidance Text */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={400}
              useNativeDriver={true}
              style={styles.guidanceWrapper}
            >
              <Text style={[styles.guidanceText, { color: theme.colors.outline }]}>
                Follow the rhythm of the circle to breathe properly
              </Text>
            </Animatable.View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  backButton: {
    margin: 0,
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  infoSection: {
    width: '100%',
    gap: 12,
  },
  phase: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  circleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionWrapper: {
    width: '100%',
    marginVertical: 20,
  },
  instructionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  guidanceWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  guidanceText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BreathingPlayerScreen;