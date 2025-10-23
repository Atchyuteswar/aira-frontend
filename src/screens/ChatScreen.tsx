import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  GiftedChat, IMessage, User, MessageTextProps, Bubble,
  InputToolbar, Send, Day, DayProps, BubbleProps, InputToolbarProps, SendProps, Composer, ComposerProps
} from 'react-native-gifted-chat';
import { Alert, StyleSheet, View, StyleProp, TextStyle, Platform, TouchableOpacity } from 'react-native';
import { useTheme, IconButton, Text } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import apiClient from '../api/client'; // Make sure this is correctly imported

const AIRA_USER: User = {
  _id: 2,
  name: 'Aira',
  avatar: require('../../assets/aira-avatar.png'),
};

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

  // --- NEW STATE FOR MOOD TRACKING ---
  const [moodSelectorVisible, setMoodSelectorVisible] = useState(false);
  const [moodLogged, setMoodLogged] = useState(false);

  // --- EFFECT TO SHOW MOOD SELECTOR ---
  useEffect(() => {
    // Show selector if convo is long enough, Aira spoke last, and mood isn't already logged
    if (
      messages.length >= 6 &&
      messages[0]?.user._id === AIRA_USER._id &&
      !moodLogged
    ) {
      setMoodSelectorVisible(true);
    }
  }, [messages, moodLogged]);


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
      // Reset mood logging state when entering the screen
      setMoodLogged(false);
      setMoodSelectorVisible(false);
      return () => ws.current?.close();
    }, [conversationId])
  );

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    ws.current?.send(newMessages[0].text);
  }, []);

  // --- NEW MOOD HANDLING LOGIC ---
  const handleMoodSelect = async (mood: string) => {
    try {
      await apiClient.post('/moods', {
        mood,
        sourceId: conversationId,
        sourceType: 'conversation',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMoodLogged(true);
      setMoodSelectorVisible(false); // Hide the selector on success
    } catch (error) {
      console.error('Failed to log mood', error);
      Alert.alert('Error', 'Could not save your mood entry.');
    }
  };


  // --- NEW MOOD SELECTOR COMPONENT ---
  const MoodSelector = () => {
    const moods = [
      { name: 'happy', icon: 'emoticon-happy-outline' },
      { name: 'calm', icon: 'emoticon-neutral-outline' },
      { name: 'sad', icon: 'emoticon-sad-outline' },
      { name: 'anxious', icon: 'emoticon-confused-outline' },
      { name: 'angry', icon: 'emoticon-angry-outline' },
    ];

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={500}
        style={[styles.moodContainer, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Text variant="bodyMedium" style={[styles.moodTitle, { color: theme.colors.onSurfaceVariant }]}>
          How are you feeling now?
        </Text>
        <View style={styles.moodIcons}>
          {moods.map(({ name, icon }) => (
            <IconButton
              key={name}
              icon={icon}
              size={32}
              iconColor={theme.colors.primary}
              onPress={() => handleMoodSelect(name)}
            />
          ))}
        </View>
      </Animatable.View>
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
          left: { backgroundColor: theme.colors.surface, borderRadius: 20 },
          right: { backgroundColor: theme.colors.primary, borderRadius: 20 },
        }}
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

  const renderDay = (props: DayProps<IMessage>) => {
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
        // --- NEW PROP TO RENDER THE MOOD SELECTOR ---
        renderFooter={() => moodSelectorVisible ? <MoodSelector /> : null}
      />
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
    // --- NEW STYLES FOR MOOD SELECTOR ---
    moodContainer: {
      padding: 16,
      margin: 10,
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    moodTitle: {
      textAlign: 'center',
      fontFamily: 'Inter_500Medium',
      marginBottom: 8,
    },
    moodIcons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
});

export default ChatScreen;