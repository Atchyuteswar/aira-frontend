import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useColorScheme, Image, ScrollView, Animated } from 'react-native';
import { useTheme, Text, ActivityIndicator, Surface, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import apiClient from '../api/client';
import * as Animatable from 'react-native-animatable';

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
  const [fadeAnim] = useState(new Animated.Value(0));

  // A color map for the different moods
  const moodColors = {
    happy: '#4CAF50', // Green
    calm: '#2196F3', // Blue
    sad: '#FFC107', // Amber
    anxious: '#9C27B0', // Purple
    angry: '#F44336', // Red
    default: theme.colors.primary,
  };

  const moodEmojis: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    sad: '😢',
    anxious: '😰',
    angry: '😠',
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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [fetchAndProcessMoods, fadeAnim])
  );

  const EmptyStateComponent = () => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={styles.emptyContainer}
    >
      <Image
        source={
          colorScheme === 'dark'
            ? require('../../assets/your-illustration-dark.png')
            : require('../../assets/your-illustration.png')
        }
        style={styles.emptyImage}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.primary }]}>
        📊 No Insights Yet
      </Text>
      <Text variant="bodyLarge" style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
        Chat with Aira to log your moods and see your emotional trends over time.
      </Text>
    </Animatable.View>
  );
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {chartData.length === 0 ? (
        <EmptyStateComponent />
      ) : (
        <Animated.View style={[{ opacity: fadeAnim }]}>
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={500}>
            <View style={styles.header}>
              <Text variant="displaySmall" style={[styles.mainTitle, { color: theme.colors.onBackground }]}>
                Your Insights
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.outline }]}>
                Track your emotional wellness
              </Text>
            </View>
          </Animatable.View>

          {/* Stats Cards */}
          <Animatable.View animation="fadeInUp" duration={600} delay={100}>
            <View style={styles.statsRow}>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <Text style={[styles.statLabel, { color: theme.colors.outline }]}>Total Moods</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {chartData.reduce((sum, item) => sum + item.value, 0)}
                </Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <Text style={[styles.statLabel, { color: theme.colors.outline }]}>Mood Types</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {chartData.length}
                </Text>
              </Surface>
            </View>
          </Animatable.View>

          {/* Chart Card */}
          <Animatable.View animation="fadeInUp" duration={600} delay={200}>
            <Surface
              style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}
              elevation={0}
            >
              <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                📈 Mood Distribution
              </Text>
              <View style={styles.chartWrapper}>
                <BarChart
                  data={chartData}
                  barWidth={32}
                  spacing={20}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  xAxisColor={theme.colors.outline}
                  yAxisColor={theme.colors.outline}
                  yAxisTextStyle={{ color: theme.colors.onSurface, fontSize: 12 }}
                  xAxisLabelTextStyle={{ color: theme.colors.onSurface, fontFamily: 'Inter_400Regular', fontSize: 11 }}
                  noOfSections={5}
                  maxValue={Math.max(...chartData.map(d => d.value), 5)}
                />
              </View>
            </Surface>
          </Animatable.View>

          {/* Mood Details */}
          <Animatable.View animation="fadeInUp" duration={600} delay={300}>
            <Surface
              style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}
              elevation={0}
            >
              <Text variant="titleMedium" style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
                💡 Mood Breakdown
              </Text>
              {chartData.map((item, index) => (
                <Animatable.View
                  key={item.label}
                  animation="slideInLeft"
                  delay={400 + index * 50}
                  useNativeDriver={true}
                  style={styles.moodDetailItem}
                >
                  <View style={styles.moodDetailRow}>
                    <View style={styles.moodDetailLeft}>
                      <Text style={styles.moodEmoji}>{moodEmojis[item.label.toLowerCase()] || '🙂'}</Text>
                      <Text style={[styles.moodName, { color: theme.colors.onSurface }]}>
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.moodDetailRight}>
                      <Text style={[styles.moodCount, { color: item.frontColor }]}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar
                    progress={item.value / Math.max(...chartData.map(d => d.value))}
                    color={item.frontColor}
                    style={[styles.progressBar, { backgroundColor: item.frontColor + '20' }]}
                  />
                </Animatable.View>
              ))}
            </Surface>
          </Animatable.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.outline }]}>
              💬 Keep chatting with Aira to build your mood history
            </Text>
          </View>
        </Animated.View>
      )}
    </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  mainTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  chartCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  chartTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  chartWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  detailsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 24,
  },
  detailsTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  moodDetailItem: {
    marginBottom: 16,
  },
  moodDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moodDetailRight: {
    alignItems: 'flex-end',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodName: {
    fontWeight: '600',
    fontSize: 14,
  },
  moodCount: {
    fontWeight: '700',
    fontSize: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    textAlign: 'center',
    fontWeight: '500',
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
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default InsightsScreen;