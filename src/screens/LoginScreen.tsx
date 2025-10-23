import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { signIn } from '../store/authSlice';
import apiClient from '../api/client';
import axios from 'axios';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // Step 1: Get the auth token
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const tokenResponse = await apiClient.post('/auth/token', params);
      const token = tokenResponse.data.access_token;

      // Step 2: Use the token to fetch the user's profile
      const profileResponse = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const name = profileResponse.data.name;
      
      // Step 3: Dispatch the signIn action with all user data
      dispatch(signIn({ token, name }));

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Login Failed", error.response.data.detail || "Please check your email and password.");
      } else {
        Alert.alert("Login Failed", "A network error occurred.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Decorative Header */}
          <View style={[styles.headerBlob, { backgroundColor: theme.colors.primary }]} />

          {/* Logo/Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text
              variant="displaySmall"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Welcome Back
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subtitle, { color: theme.colors.outline }]}
            >
              Sign in to continue to your wellness journey
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              left={<TextInput.Icon icon="email-outline" />}
              mode="outlined"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              editable={!loading}
              left={<TextInput.Icon icon="lock-outline" />}
              mode="outlined"
            />

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              loading={loading}
              disabled={loading || !email || !password}
              labelStyle={styles.buttonLabel}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.outline }]}>
                New to Aira?
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            </View>

            {/* Sign Up Button */}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signUpButton}
              labelStyle={[styles.signUpLabel, { color: theme.colors.primary }]}
            >
              Create an Account
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.outline }]}>
              Your wellness matters. Secure & private.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  welcomeSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
    borderRadius: 12,
    width: '100%',
  },
  loginButton: {
    marginVertical: 24,
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontWeight: '500',
  },
  signUpButton: {
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    width: '100%',
  },
  signUpLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;