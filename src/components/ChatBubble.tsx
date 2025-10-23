import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme, MD3Theme } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';

// 1. Define the props the component will accept
interface ChatBubbleProps {
  message: string;
  isUser: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser }) => {
  // 2. Get the current theme from React Native Paper
  const theme = useTheme();
  const { colors, roundness } = theme;
  const styles = createStyles(colors, roundness);
  
  // 3. Animation setup
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // 4. Conditionally choose styles based on the 'isUser' prop
  const bubbleStyle = isUser ? styles.userBubble : styles.airaBubble;
  const textStyle = isUser ? styles.userText : styles.airaText;
  const wrapperStyle = isUser ? styles.userWrapper : styles.airaWrapper;

  return (
    <View style={wrapperStyle}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.bubble, bubbleStyle]}>
          <Text style={textStyle}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// 4. Create a StyleSheet function to access theme colors
const createStyles = (colors: MD3Theme['colors'], roundness: number) =>
  StyleSheet.create({
    animatedContainer: {
      width: '100%',
    },
    wrapper: {
      marginVertical: 4,
    },
    userWrapper: {
      alignItems: 'flex-end',
      marginVertical: 8,
    },
    airaWrapper: {
      alignItems: 'flex-start',
      marginVertical: 8,
    },
    bubble: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: roundness * 2,
      maxWidth: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    airaBubble: {
      backgroundColor: colors.surfaceVariant,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.outline + '20',
    },
    userText: {
      color: '#FFFFFF',
      fontSize: 15,
      lineHeight: 20,
    },
    airaText: {
      color: colors.onSurface,
      fontSize: 15,
      lineHeight: 20,
    },
  });

export default ChatBubble;