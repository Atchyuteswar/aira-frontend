import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useColorScheme, Image } from 'react-native';
import { useTheme, Text, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import apiClient from '../api/client';

// Define the structure of a single mood entry from the API
interface MoodEntry {
  _id: string;
  mood: string;
  createdAt: string;
}

// Define the structure for the data the BarChart component needs
interface ChartDataItem {
  value: number;
  label: string;
  frontColor: string;
}

const InsightsScreen = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  // A color map for the different moods
  const moodColors = {
    happy: '#4CAF50', // Green
    calm: '#2196F3', // Blue
    sad: '#FFC107', // Amber
    anxious: '#9C27B0', // Purple
    angry: '#F44336', // Red
    default: theme.colors.primary,
  };

  const fetchAndProcessMoods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<MoodEntry[]>('/moods');
      const moods = response.data;

      if (moods.length > 0) {
        // Process the data: count occurrences of each mood
        const moodCounts = moods.reduce((acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Format the processed data for the chart library
        const formattedChartData = Object.entries(moodCounts).map(([mood, count]) => ({
          value: count,
          label: mood.charAt(0).toUpperCase() + mood.slice(1), // Capitalize label
          frontColor: moodColors[mood as keyof typeof moodColors] || moodColors.default,
        }));
        setChartData(formattedChartData);
      } else {
        setChartData([]); // Ensure chart is empty if no data
      }
    } catch (error) {
      console.error('Failed to fetch mood data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAndProcessMoods();
    }, [fetchAndProcessMoods])
  );

  const EmptyStateComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={
          colorScheme === 'dark'
            ? require('../../assets/your-illustration-dark.png') // Use dark illustration for dark mode
            : require('../../assets/your-illustration.png') // Use light illustration for light mode
        }
        style={styles.emptyImage}
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>No Insights Yet</Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        Chat with Aira to log your moods and see your emotional trends over time.
      </Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {chartData.length === 0 ? (
        <EmptyStateComponent />
      ) : (
        <View style={styles.chartContainer}>
            <Text variant="titleLarge" style={styles.title}>Your Mood Summary</Text>
            <BarChart
                data={chartData}
                barWidth={40}
                spacing={25}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={1}
                yAxisThickness={1}
                xAxisColor={theme.colors.outline}
                yAxisColor={theme.colors.outline}
                yAxisTextStyle={{ color: theme.colors.onSurface }}
                xAxisLabelTextStyle={{ color: theme.colors.onSurface, fontFamily: 'Inter_400Regular' }}
                noOfSections={5}
                maxValue={Math.max(...chartData.map(d => d.value), 5)} // Ensure Y-axis has a reasonable max
            />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyImage: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default InsightsScreen;