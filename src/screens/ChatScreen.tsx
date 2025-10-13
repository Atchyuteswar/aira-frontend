import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  GiftedChat, IMessage, User, MessageTextProps, Bubble,
  InputToolbar, Send, Day, DayProps, BubbleProps, InputToolbarProps, SendProps, Composer, ComposerProps
} from 'react-native-gifted-chat';
import { Alert, StyleSheet, View, StyleProp, TextStyle, Platform } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import * as Animatable from 'react-native-animatable';

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

  const markdownStyle = StyleSheet.create({
    body: { fontSize: 16, fontFamily: 'Inter_400Regular' },
    strong: { fontFamily: 'Inter_700Bold' },
    link: { textDecorationLine: 'underline' },
  });

  useFocusEffect(
    useCallback(() => {
      // const WEBSOCKET_URL = `ws://192.168.0.8:8000/chat/ws/${conversationId}`;
      const WEBSOCKET_URL = `wss://aira-backend-ver1-0.onrender.com/chat/ws/${conversationId}`;
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
      return () => ws.current?.close();
    }, [conversationId])
  );

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    ws.current?.send(newMessages[0].text);
  }, []);

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
        left: { backgroundColor: theme.colors.surface, borderRadius: theme.roundness * 1.5 },
        right: { backgroundColor: theme.colors.primary, borderRadius: theme.roundness * 1.5 },
      }}
      textStyle={{
        left: { color: theme.colors.onSurface },
        right: { color: '#FFFFFF' },
      }}
      bottomContainerStyle={{
        left: { justifyContent: 'flex-start' },
        right: { justifyContent: 'flex-end' },
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
          onPress={() => {
            console.log('Mic button pressed');
            // TODO: Add voice input logic here in the future
          }}
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
});

export default ChatScreen;