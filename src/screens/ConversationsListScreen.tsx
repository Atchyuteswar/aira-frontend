import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Pressable,
  Animated,
  Image,
  useColorScheme,
} from "react-native";
import {
  FAB,
  ActivityIndicator,
  Text,
  useTheme,
  Avatar,
  Menu,
  Divider,
  Dialog,
  Portal,
  Button,
  TextInput,
  Snackbar, // --- 1. IMPORT SNACKBAR ---
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Animatable from "react-native-animatable";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage"; // --- 1. IMPORT ASYNCSTORAGE ---

dayjs.extend(relativeTime);

const CONVERSATIONS_PER_PAGE = 20;
const CACHE_KEY = "cachedConversations"; // Define a key for our cache

interface Conversation {
  _id: string;
  title: string;
  lastMessage?: {
    text: string;
    createdAt: string;
  };
}

const AnimatedConversationCard = ({
  item,
  index,
  navigation,
  onLongPress,
}: {
  item: Conversation;
  index: number;
  navigation: any;
  onLongPress: () => void;
}) => {
  // (This component is unchanged)
  const theme = useTheme();
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
      <Pressable
        onPress={() =>
          navigation.navigate("Chat", {
            conversationId: item._id,
            title: item.title,
          })
        }
        onLongPress={onLongPress}
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.colors.surface },
          pressed && styles.cardPressed,
        ]}
      >
        <Avatar.Image
          size={40}
          source={require("../../assets/aira-avatar.png")}
          style={{ marginRight: 16 }}
        />
        <View style={styles.cardTextContainer}>
          <Text variant="titleMedium" numberOfLines={1}>
            {item.title}
          </Text>
          {item.lastMessage ? (
            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={{ color: theme.colors.outline }}
            >
              {item.lastMessage.text}
            </Text>
          ) : (
            <Text
              variant="bodyMedium"
              style={{ fontStyle: "italic", color: theme.colors.outline }}
            >
              No messages yet
            </Text>
          )}
        </View>
        {item.lastMessage && (
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {dayjs(item.lastMessage.createdAt).fromNow(true)}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const ConversationsListScreen = ({ navigation }: any) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // --- 2. NEW STATE FOR OFFLINE INDICATOR ---

  const theme = useTheme();
  // (Other state variables are unchanged)
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // --- 3. UPDATED FETCH LOGIC WITH CACHING ---
  const fetchConversations = async (currentPage: number, isRefresh = false) => {
    if ((loadingMore || !hasMore) && !isRefresh) return;
    if (currentPage > 0) setLoadingMore(true);

    try {
      const response = await apiClient.get("/conversations/", {
        params: {
          skip: currentPage * CONVERSATIONS_PER_PAGE,
          limit: CONVERSATIONS_PER_PAGE,
        },
      });
      setIsOffline(false); // We're online, hide the snackbar
      const { items, total } = response.data;

      const newConversations =
        currentPage === 0 ? items : [...conversations, ...items];
      setConversations(newConversations);

      // --- SAVE TO CACHE (ONLY THE FIRST PAGE FOR SIMPLICITY) ---
      if (currentPage === 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
      }

      setPage(currentPage + 1);
      setHasMore(newConversations.length < total);
    } catch (error) {
      console.error("Failed to fetch conversations (likely offline):", error);
      setIsOffline(true); // Show offline snackbar
      // Don't alert if we already have cached data to show
      if (conversations.length === 0) {
        Alert.alert("Error", "Could not load your conversations.");
      }
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // --- 4. NEW CACHE-FIRST LOADING LOGIC ---
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setInitialLoading(true);
        // Load from cache first for instant UI
        try {
          const cachedData = await AsyncStorage.getItem(CACHE_KEY);
          if (cachedData) {
            setConversations(JSON.parse(cachedData));
          }
        } catch (e) {
          console.error("Failed to load from cache", e);
        }

        // Then, fetch from network to get the latest
        await handleRefresh();
        setInitialLoading(false);
      };

      loadData();
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    setPage(0);
    setHasMore(true);
    // Don't clear conversations immediately, wait for fetch
    await fetchConversations(0, true);
  }, []);

  const handleLoadMore = () => {
    if (!isOffline) {
      // Don't try to load more if we're offline
      fetchConversations(page);
    }
  };

  // (Other handlers like openMenu, handleRename, handleDelete, etc. are unchanged)
  const openMenu = (convo: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedConvo(convo);
    setNewTitle(convo.title);
    setMenuVisible(true);
  };
  const closeMenu = () => setMenuVisible(false);

  const showRenameDialog = () => {
    closeMenu();
    setRenameDialogVisible(true);
  };
  const hideRenameDialog = () => setRenameDialogVisible(false);

  const showDeleteDialog = () => {
    closeMenu();
    setDeleteDialogVisible(true);
  };
  const hideDeleteDialog = () => setDeleteDialogVisible(false);

  const handleRename = async () => {
    if (!selectedConvo || !newTitle) return;
    try {
      await apiClient.put(`/conversations/${selectedConvo._id}`, {
        title: newTitle,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updatedConversations = conversations.map((c) =>
        c._id === selectedConvo._id ? { ...c, title: newTitle } : c
      );
      setConversations(updatedConversations);
      // Update cache after rename
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to rename conversation. You may be offline."
      );
    } finally {
      hideRenameDialog();
    }
  };

  const handleDelete = async () => {
    if (!selectedConvo) return;
    try {
      await apiClient.delete(`/conversations/${selectedConvo._id}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updatedConversations = conversations.filter(
        (c) => c._id !== selectedConvo._id
      );
      setConversations(updatedConversations);
      // Update cache after delete
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to delete conversation. You may be offline."
      );
    } finally {
      hideDeleteDialog();
    }
  };

  const handleNewChat = async () => {
    // Creating new chats is disabled offline
    if (isOffline) {
      Alert.alert(
        "You are offline",
        "Please connect to the internet to start a new chat."
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const response = await apiClient.post("/conversations/");
      navigation.navigate("Chat", {
        conversationId: response.data._id,
        title: response.data.title,
      });
    } catch (error) {
      console.error("Failed to create new chat", error);
      Alert.alert("Error", "Could not start a new chat.");
    }
  };

  const EmptyListComponent = () => {
    // (This component is unchanged)
    const illustrationSource =
      colorScheme === "dark"
        ? require("../../assets/your-illustration-dark.png")
        : require("../../assets/your-illustration.png");
    return (
      <View style={styles.emptyContainer}>
        <Image source={illustrationSource} style={styles.emptyImage} />
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Ready for a new chat?
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
          Press the '+' button to start a new conversation with Aira.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  // Show loader only if we have no cached data to display
  if (initialLoading && conversations.length === 0) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <Portal.Host>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <Menu
              visible={menuVisible && selectedConvo?._id === item._id}
              onDismiss={closeMenu}
              anchor={
                <AnimatedConversationCard
                  item={item}
                  index={index}
                  navigation={navigation}
                  onLongPress={() => openMenu(item)}
                />
              }
            >
              <Menu.Item
                onPress={showRenameDialog}
                title="Rename"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={showDeleteDialog}
                title="Delete"
                titleStyle={{ color: theme.colors.error }}
                leadingIcon="delete"
              />
            </Menu>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!initialLoading ? EmptyListComponent : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        />
        <Animatable.View
          animation="bounceInUp"
          duration={1000}
          delay={300}
          useNativeDriver={true}
        >
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            color={theme.colors.onPrimary}
            onPress={handleNewChat}
          />
        </Animatable.View>

        {/* (Dialogs are unchanged) */}
        <Portal>
          <Dialog
            visible={renameDialogVisible}
            onDismiss={hideRenameDialog}
            style={styles.dialog}
          >
            <Dialog.Title>Rename Conversation</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="New Title"
                value={newTitle}
                onChangeText={setNewTitle}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideRenameDialog}>Cancel</Button>
              <Button onPress={handleRename}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={hideDeleteDialog}
            style={styles.dialog}
          >
            <Dialog.Title>Delete Conversation</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Are you sure you want to permanently delete this conversation
                and all its messages?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDeleteDialog}>Cancel</Button>
              <Button onPress={handleDelete} textColor={theme.colors.error}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* --- 5. OFFLINE INDICATOR SNACKBAR --- */}
        <Snackbar
          visible={isOffline}
          onDismiss={() => setIsOffline(false)}
          duration={Snackbar.DURATION_INDEFINITE}
          action={{
            label: "Dismiss",
            onPress: () => setIsOffline(false),
          }}
        >
          You are offline. Displaying cached conversations.
        </Snackbar>
      </View>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  // (Styles are unchanged)
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 8, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 28,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardTextContainer: { flex: 1, marginRight: 8 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
  dialog: { borderRadius: 28 },
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

export default ConversationsListScreen;
