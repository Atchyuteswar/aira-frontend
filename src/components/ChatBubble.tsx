import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, MD3Theme } from 'react-native-paper';
// Using MD3Theme from react-native-paper instead of custom ThemeColors

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

  // 3. Conditionally choose styles based on the 'isUser' prop
  const bubbleStyle = isUser ? styles.userBubble : styles.airaBubble;
  const textStyle = isUser ? styles.userText : styles.airaText;
  const wrapperStyle = isUser ? styles.userWrapper : styles.airaWrapper;

  return (
    <View style={wrapperStyle}>
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={textStyle}>{message}</Text>
      </View>
    </View>
  );
};

// 4. Create a StyleSheet function to access theme colors
const createStyles = (colors: MD3Theme['colors'], roundness: number) =>
  StyleSheet.create({
    wrapper: {
      marginVertical: 4,
    },
    userWrapper: {
      alignItems: 'flex-end',
    },
    airaWrapper: {
      alignItems: 'flex-start',
    },
    bubble: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: roundness * 1.5, // Using theme's roundness
      maxWidth: '80%',
    },
    userBubble: {
      backgroundColor: colors.primary,
    },
    airaBubble: {
      backgroundColor: colors.surface,
    },
    userText: {
      color: '#FFFFFF', // Explicitly white as defined in our palette logic
    },
    airaText: {
      color: colors.onSurface, 
    },
  });

export default ChatBubble;