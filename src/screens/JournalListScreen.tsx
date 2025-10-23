import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  useColorScheme,
  ScrollView,
} from "react-native";
import {
  FAB,
  ActivityIndicator,
  Text,
  useTheme,
  Surface,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import apiClient from "../api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface JournalEntry {
  _id: string;
  title: string;
  createdAt: string;
  content: string;
}

const AnimatedJournalCard = ({
  item,
  index,
  navigation,
}: {
  item: JournalEntry;
  index: number;
  navigation: any;
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const PADDING = 8;
  const GAP = 12;
  const cardSize = (width - PADDING * 2 - GAP) / 2;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim, index]);

  const contentPreview = item.content.substring(0, 60);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <Pressable
        onPress={() =>
          navigation.navigate("JournalView", { entryId: item._id })
        }
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: theme.colors.surface,
          },
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardTop}>
          <Text
            variant="titleMedium"
            numberOfLines={2}
            style={[styles.cardTitle, { color: theme.colors.onBackground }]}
          >
            {item.title}
          </Text>
        </View>

        <Text
          variant="bodySmall"
          numberOfLines={3}
          style={[styles.cardContent, { color: theme.colors.outline }]}
        >
          {contentPreview}
          {item.content.length > 60 ? "..." : ""}
        </Text>

        <View style={styles.cardFooter}>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.primary,
              fontWeight: "600",
              backgroundColor: theme.colors.primary + "15",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {dayjs(item.createdAt).fromNow()}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const JournalListScreen = ({ navigation }: any) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/journal/");
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch journal entries", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [])
  );

  const EmptyListComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📔</Text>
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Your Journal Awaits
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
          Start capturing your thoughts and feelings by pressing the '+' button
        </Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animatable.View
        animation="fadeInDown"
        duration={600}
        useNativeDriver={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📝</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Your Journal
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: theme.colors.outline }]}
          >
            Capture your thoughts and feelings
          </Text>
        </View>
      </Animatable.View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        numColumns={2}
        key={2}
        renderItem={({ item, index }) => (
          <AnimatedJournalCard
            item={item}
            index={index}
            navigation={navigation}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyListComponent}
        scrollEnabled={true}
      />

      <Animatable.View
        animation="bounceInUp"
        duration={1000}
        delay={300}
        useNativeDriver={true}
        style={styles.fabContainer}
      >
        <FAB
          icon="plus"
          style={{ backgroundColor: theme.colors.primary }}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate("JournalEdit", { entryId: null })}
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: "center",
  },
  listContent: { padding: 12, paddingBottom: 32, flexGrow: 1 },
  card: {
    margin: 6,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTop: {
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "700" },
  cardContent: { lineHeight: 18, marginBottom: 12 },
  cardFooter: {
    marginTop: "auto",
  },
  fabContainer: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
  },
});

export default JournalListScreen;
