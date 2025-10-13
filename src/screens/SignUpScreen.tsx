import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { signIn } from '../store/authSlice';
import apiClient from '../api/client'; // Use the central API client
import axios from 'axios';

const SignUpScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Step 1: Register the new user
      await apiClient.post('/auth/register', { email, password });

      // Step 2: Automatically log the new user in to get a token
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const tokenResponse = await apiClient.post('/auth/token', params);
      const token = tokenResponse.data.access_token;

      // Step 3: Use the new token to fetch the user's profile
      const profileResponse = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const name = profileResponse.data.name;

      // Step 4: Dispatch the signIn action to update the app state
      dispatch(signIn({ token, name }));

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Sign Up Failed", error.response.data.detail || "An error occurred.");
      } else {
        Alert.alert("Sign Up Failed", "An unknown error occurred.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
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
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Sign Up
      </Button>
      <Button
        onPress={() => navigation.navigate('Login')}
        style={styles.button}
      >
        Already have an account? Login
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

export default SignUpScreen;