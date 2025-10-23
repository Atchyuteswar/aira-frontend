import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  GiftedChat, IMessage, User, MessageTextProps, Bubble,
  InputToolbar, Send, Day, DayProps, BubbleProps, InputToolbarProps, SendProps, Composer, ComposerProps
} from 'react-native-gifted-chat';
import { Alert, StyleSheet, View, StyleProp, TextStyle, Platform, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useTheme, IconButton, Text, Surface, Avatar, Chip, Dialog, Portal, Button } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client'; // Make sure this is correctly imported

const AIRA_USER: User = {
  _id: 2,
  name: 'Aira',
  avatar: require('../../assets/aira-avatar.png'),
};

const MOOD_TRACKER_KEY = 'mood_tracker_last_time';
const MOOD_PROMPT_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const formatMessages = (serverMessages: any[]): IMessage[] => {
  return serverMessages.map(msg => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  })).reverse();
};

const ChatScreen = ({ route }: any) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const theme = useTheme();

  // --- NEW STATE FOR MOOD TRACKING WITH 12-HOUR COOLDOWN ---
  const [moodSelectorVisible, setMoodSelectorVisible] = useState(false);
  const [moodLogged, setMoodLogged] = useState(false);
  const [showMoodNotification, setShowMoodNotification] = useState(false);

  // --- EFFECT TO SHOW MOOD SELECTOR WITH TIME-BASED LOGIC ---
  useEffect(() => {
    const checkMoodPrompt = async () => {
      try {
        // Show selector if convo is long enough and Aira spoke last
        if (messages.length >= 6 && messages[0]?.user._id === AIRA_USER._id) {
          const lastMoodTime = await AsyncStorage.getItem(MOOD_TRACKER_KEY);
          const now = Date.now();
          
          if (!lastMoodTime) {
            // First time - show notification popup
            setShowMoodNotification(true);
            setMoodSelectorVisible(true);
          } else {
            const lastTime = parseInt(lastMoodTime);
            const timeSinceLastMood = now - lastTime;
            
            // Only show if 12 hours have passed
            if (timeSinceLastMood >= MOOD_PROMPT_INTERVAL) {
              setShowMoodNotification(true);
              setMoodSelectorVisible(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking mood prompt:', error);
      }
    };

    checkMoodPrompt();
  }, [messages]);


  const markdownStyle = StyleSheet.create({
    body: { fontSize: 16, fontFamily: 'Inter_400Regular' },
    strong: { fontFamily: 'Inter_700Bold' },
    link: { textDecorationLine: 'underline' },
  });

  useFocusEffect(
    useCallback(() => {
      const WEBSOCKET_URL = `wss://aira-backend-ver1-0.onrender.com/chat/ws/${conversationId}`;
      // const WEBSOCKET_URL = `ws://172.16.17.147:8000/chat/ws/${conversationId}`;
      ws.current = new WebSocket(WEBSOCKET_URL);
      ws.current.onopen = () => console.log(`WebSocket opened for ${conversationId}`);
      ws.current.onclose = () => console.log(`WebSocket closed for ${conversationId}`);
      ws.current.onerror = (e) => { console.error('WebSocket error:', e); Alert.alert('Connection Error', 'Could not connect.'); };
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'history') { setMessages(formatMessages(data.messages)); }
        else if (data.type === 'new_message') {
          const newMessage = { ...data.message, createdAt: new Date(data.message.createdAt) };
          setMessages((previousMessages) => GiftedChat.append(previousMessages, [newMessage]));
        }
      };
      // Don't reset mood logging state - let the time-based check handle it
      return () => ws.current?.close();
    }, [conversationId])
  );

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    ws.current?.send(newMessages[0].text);
  }, []);

  // --- NEW MOOD HANDLING LOGIC WITH TIMESTAMP STORAGE ---
  const handleMoodSelect = async (mood: string) => {
    try {
      await apiClient.post('/moods', {
        mood,
        sourceId: conversationId,
        sourceType: 'conversation',
      });
      
      // Store the current time when mood was logged
      await AsyncStorage.setItem(MOOD_TRACKER_KEY, Date.now().toString());
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMoodLogged(true);
      setMoodSelectorVisible(false);
      setShowMoodNotification(false);
    } catch (error) {
      console.error('Failed to log mood', error);
      Alert.alert('Error', 'Could not save your mood entry.');
    }
  };

  const handleSkipMood = async () => {
    // Still save the skip time so we don't prompt for 12 hours
    await AsyncStorage.setItem(MOOD_TRACKER_KEY, Date.now().toString());
    setMoodSelectorVisible(false);
    setShowMoodNotification(false);
  };



  // --- NEW MOOD SELECTOR COMPONENT WITH IMPROVED UX ---
  const MoodSelector = () => {
    const moods = [
      { name: 'happy', icon: 'emoticon-happy-outline', emoji: '😊' },
      { name: 'calm', icon: 'emoticon-neutral-outline', emoji: '😌' },
      { name: 'sad', icon: 'emoticon-sad-outline', emoji: '😢' },
      { name: 'anxious', icon: 'emoticon-confused-outline', emoji: '😰' },
      { name: 'angry', icon: 'emoticon-angry-outline', emoji: '😠' },
    ];

    return (
      <View style={styles.moodPopupContent}>
        <Animatable.View
          animation="bounceInUp"
          duration={500}
          style={[styles.moodContainer, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <View style={styles.moodHeaderRow}>
            <View style={styles.moodHeaderContent}>
              <Avatar.Image 
                size={36} 
                source={require('../../assets/aira-avatar.png')}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
                  How are you feeling?
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                  Share your mood with Aira
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSkipMood}
              style={styles.closeButton}
            >
              <IconButton icon="close" size={24} iconColor={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.moodGrid}>
            {moods.map(({ name, emoji }, index) => (
              <Animatable.View 
                key={name}
                animation="bounceIn"
                delay={index * 60}
                useNativeDriver={true}
                style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}
              >
                <TouchableOpacity
                  onPress={() => handleMoodSelect(name)}
                  activeOpacity={0.7}
                  style={[styles.moodButton, { backgroundColor: theme.colors.primary + '20' }]}
                >
                  <Text style={[styles.moodEmoji, { color: theme.colors.primary }]}>
                    {emoji}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.moodLabel, { color: theme.colors.primary }]}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>
      </View>
    );
  };

  // --- NEW MOOD NOTIFICATION COMPONENT ---
  const MoodNotification = () => {
    return (
      <Portal>
        <Dialog visible={showMoodNotification} onDismiss={handleSkipMood}>
          <Dialog.Title style={{ textAlign: 'center' }}>
            📊 Check In With Your Mood
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginVertical: 8 }}>
              It's been a while! We'd love to hear how you're feeling right now.
            </Text>
            <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.outline, marginTop: 8 }}>
              Your mood entries help us provide better support.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 12 }}>
            <Button
              mode="outlined"
              onPress={handleSkipMood}
              style={{ marginRight: 8 }}
            >
              Later
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowMoodNotification(false)}
              buttonColor={theme.colors.primary}
            >
              Share Mood
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };


  const renderCustomMessageText = (props: MessageTextProps<IMessage>) => {
    const { currentMessage } = props;
    if (currentMessage) {
        const textColor = currentMessage.user._id === 1 ? '#FFFFFF' : theme.colors.onSurface;
        return (
            <View style={styles.markdownContainer}>
                <Markdown style={{...markdownStyle, body: {...markdownStyle.body, color: textColor}, link: {...markdownStyle.link, color: textColor}}}>
                    {currentMessage.text}
                </Markdown>
            </View>
        );
    }
    return null;
  };

  const renderBubble = (props: BubbleProps<IMessage>) => (
    <Animatable.View animation="fadeInUp" duration={400} useNativeDriver={true}>
      <Bubble {...props}
        wrapperStyle={{
          left: { 
            backgroundColor: theme.colors.surface, 
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.outline + '20',
            marginBottom: 4,
          },
          right: { 
            backgroundColor: theme.colors.primary, 
            borderRadius: 20,
            marginBottom: 4,
          },
        }}
        textStyle={{
          right: { color: theme.colors.onPrimary },
          left: { color: theme.colors.onSurface },
        }}
        tickStyle={{ color: theme.colors.onPrimary }}
      />
    </Animatable.View>
  );

  const renderInputToolbar = (props: InputToolbarProps<IMessage>) => (
    <InputToolbar {...props}
      containerStyle={[
          styles.inputToolbar,
          { backgroundColor: theme.colors.surface }
      ]}
      primaryStyle={styles.toolbarPrimary}
    />
  );
  
  const renderComposer = (props: ComposerProps) => (
    <Composer {...props}
      textInputStyle={[
        styles.textInput,
        { color: theme.colors.onSurface }
      ]}
    />
  );

  const renderSend = (props: SendProps<IMessage>) => {
    if (props.text && props.text.trim().length > 0) {
      return (
        <Send {...props} containerStyle={styles.sendContainer}>
          <IconButton icon="arrow-up-circle" size={32} iconColor={theme.colors.primary} />
        </Send>
      );
    }
    return (
      <View style={styles.sendContainer}>
        <IconButton
          icon="microphone"
          size={28}
          iconColor={theme.colors.primary}
          onPress={() => console.log('Mic button pressed')}
        />
      </View>
    );
  };

  const renderDay = (props: DayProps) => {
      const dayTextStyle: StyleProp<TextStyle> = {
        color: theme.colors.outline,
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
      };
      return <Day {...props} textStyle={dayTextStyle} />
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GiftedChat
        messages={messages}
        onSend={(msgs) => onSend(msgs)}
        user={{ _id: 1 }}
        placeholder="Type your message here..."
        renderMessageText={renderCustomMessageText}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderSend={renderSend}
        renderDay={renderDay}
        messagesContainerStyle={styles.messagesContainer}
        minInputToolbarHeight={55}
      />
      
      {/* Mood Notification Dialog */}
      <MoodNotification />
      
      {/* Mood Selector Popup */}
      {moodSelectorVisible && !showMoodNotification && (
        <Animatable.View
          animation="slideInUp"
          duration={400}
          style={[styles.moodPopupOverlay]}
        >
          <MoodSelector />
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    messagesContainer: {
      paddingBottom: 10,
    },
    markdownContainer: { paddingHorizontal: 10, paddingVertical: 5 },
    inputToolbar: {
        marginHorizontal: 10,
        marginBottom: Platform.OS === 'ios' ? 0 : 6,
        borderRadius: 24,
        borderTopWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    toolbarPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 22,
    },
    sendContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    moodContainer: {
      padding: 24,
      marginHorizontal: 12,
      marginVertical: 12,
      marginBottom: Platform.OS === 'ios' ? 20 : 12,
      borderRadius: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    moodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    moodGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginTop: 6,
    },
    moodButton: {
      width: 48,
      height: 48,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    moodEmoji: {
      fontSize: 40,
      lineHeight: 44,
      textAlignVertical: 'center',
    },
    moodEmojiContainer: {
      width: '100%',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moodLabel: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
    moodPopupOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingBottom: Platform.OS === 'ios' ? 34 : 0,
      zIndex: 1000,
    },
    moodPopupContent: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    moodHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    moodHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    closeButton: {
      marginRight: -8,
      marginTop: -8,
    },
});

export default ChatScreen;