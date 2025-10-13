// src/App.tsx

import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Provider as StoreProvider,
  useSelector,
  useDispatch,
} from "react-redux";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { store, RootState, AppDispatch } from "./store/store";
import {
  paperLightTheme,
  paperDarkTheme,
  navLightTheme,
  navDarkTheme,
} from "./constants/theme";
import { signIn, setLoading } from "./store/authSlice";
import RootNavigator from "./navigation/RootNavigator";
import AuthNavigator from "./navigation/AuthNavigator";
import * as SecureStore from "expo-secure-store";
import setupInterceptors from "./api/setupInterceptors";
import apiClient from "./api/client";

setupInterceptors(store);

const AppContent = () => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const { userToken, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const themePreference = useSelector((state: RootState) => state.theme.theme);
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme();

  const isDarkMode =
    themePreference === "dark" ||
    (themePreference === "system" && colorScheme === "dark");
  const paperTheme = isDarkMode ? paperDarkTheme : paperLightTheme;
  const navTheme = isDarkMode ? navDarkTheme : navLightTheme;

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token: string | null = null;
      try {
        token = await SecureStore.getItemAsync("userToken");
        if (token) {
          // --- THIS IS THE FIX ---
          // Manually provide the token for this first request, as the
          // Redux state isn't updated yet for the interceptor to use.
          const response = await apiClient.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { name } = response.data;
          dispatch(signIn({ token, name }));
        } else {
          dispatch(setLoading(false));
        }
      } catch (e) {
        console.warn("Token restore failed:", e);
        dispatch(setLoading(false));
        await SecureStore.deleteItemAsync("userToken");
      }
    };
    bootstrapAsync();
  }, [dispatch]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        {userToken ? <RootNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <StoreProvider store={store}>
      <AppContent />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
});
