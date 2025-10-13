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
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "../api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Animatable from "react-native-animatable";

dayjs.extend(relativeTime);

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
          source={require("../../assets/aira-avatar.png")} // Your new avatar image
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
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fetchConversations = async () => {
    try {
      const response = await apiClient.get("/conversations/");
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
      Alert.alert("Error", "Could not load your conversations.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const openMenu = (convo: Conversation) => {
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
      setConversations((convos) =>
        convos.map((c) =>
          c._id === selectedConvo._id ? { ...c, title: newTitle } : c
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to rename conversation.");
    } finally {
      hideRenameDialog();
    }
  };

  const handleDelete = async () => {
    if (!selectedConvo) return;
    try {
      await apiClient.delete(`/conversations/${selectedConvo._id}`);
      setConversations((convos) =>
        convos.filter((c) => c._id !== selectedConvo._id)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete conversation.");
    } finally {
      hideDeleteDialog();
    }
  };

  const handleNewChat = async () => {
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

  // --- NEW ILLUSTRATED EMPTY STATE COMPONENT ---
  const EmptyListComponent = () => {
    // 3. Add logic to select the correct illustration
    const illustrationSource =
      colorScheme === 'dark'
        ? require("../../assets/your-illustration-dark.png")
        : require("../../assets/your-illustration.png");

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={illustrationSource} // Use the selected illustration
          style={styles.emptyImage}
        />
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Ready for a new chat?
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
          Press the '+' button to start a new conversation with Aira.
        </Text>
      </View>
    );
  };

  if (loading) {
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
          ListEmptyComponent={EmptyListComponent}
        />
        <Animatable.View
          animation="bounceInUp" // This is the animation!
          duration={1000} // Animation speed in milliseconds
          delay={300} // Wait a moment before animating
          useNativeDriver={true}
        >
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            color={theme.colors.onPrimary}
            onPress={handleNewChat}
          />
        </Animatable.View>

        {/* Rename Dialog */}
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

        {/* Delete Confirmation Dialog */}
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
      </View>
    </Portal.Host>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 8, flexGrow: 1 }, // Added flexGrow for empty state
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 20, // Matched to new theme roundness
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardTextContainer: { flex: 1, marginRight: 8 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
  dialog: { borderRadius: 20 }, // Matched to new theme roundness

  // --- NEW STYLES FOR THE EMPTY STATE ---
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
