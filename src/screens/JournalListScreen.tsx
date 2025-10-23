import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  Image,
  useColorScheme,
} from "react-native";
import { FAB, ActivityIndicator, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import apiClient from "../api/client";
import dayjs from "dayjs";
// --- 1. REMOVE THE SHARED ELEMENT IMPORT ---
// import { SharedElement } from "react-navigation-shared-element";

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

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {/* --- 2. REMOVE THE SHARED ELEMENT WRAPPER --- */}
      {/* <SharedElement id={`item.${item._id}.card`}> */}
      <Pressable
        // --- 3. REVERT NAVIGATION TO PASS ONLY entryId ---
        onPress={() =>
          navigation.navigate("JournalView", { entryId: item._id }) // Changed back
        }
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={[
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: theme.colors.surface,
          },
          styles.card,
        ]}
      >
        <View>
          <Text
            variant="titleMedium"
            numberOfLines={2}
            style={styles.cardTitle}
          >
            {item.title}
          </Text>
          <Text
            variant="bodySmall"
            numberOfLines={3}
            style={[styles.cardContent, { color: theme.colors.outline }]}
          >
            {item.content}
          </Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
          {dayjs(item.createdAt).format("MMM D, YYYY")}
        </Text>
      </Pressable>
      {/* </SharedElement> */}
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
    const illustrationSource =
      colorScheme === "dark"
        ? require("../../assets/journal-illustration-dark.png")
        : require("../../assets/journal-illustration.png");

    return (
      <View style={styles.emptyContainer}>
        <Image source={illustrationSource} style={styles.emptyImage} />
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Your Journal Awaits
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
          Press the '+' button to capture your thoughts and feelings.
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
  listContent: { padding: 8, flexGrow: 1 },
  card: {
    margin: 6,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: 28,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTitle: { fontFamily: "Inter_500Medium" },
  cardContent: { marginTop: 8 },
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
    padding: 32,
  },
  emptyImage: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default JournalListScreen;