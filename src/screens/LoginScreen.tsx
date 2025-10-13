import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { signIn } from '../store/authSlice';
import apiClient from '../api/client';
import axios from 'axios';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
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
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Welcome Back</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Login
      </Button>
      <Button
        onPress={() => navigation.navigate('SignUp')}
        style={styles.button}
      >
        Don't have an account? Sign Up
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default LoginScreen;