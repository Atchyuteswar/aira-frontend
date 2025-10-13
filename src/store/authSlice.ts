import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userToken: string | null;
  isLoading: boolean;
  name: string | null; // Add name to the state
}

const initialState: AuthState = {
  userToken: null,
  isLoading: true,
  name: null, // Initial value
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // signIn now accepts an optional name
    signIn: (state, action: PayloadAction<{ token: string; name?: string }>) => {
      state.userToken = action.payload.token;
      state.name = action.payload.name || null;
      state.isLoading = false;
    },
    signOut: (state) => {
      state.userToken = null;
      state.name = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Reducer to update just the name
    setUserName: (state, action: PayloadAction<string>) => {
        state.name = action.payload;
    }
  },
});

export const { signIn, signOut, setLoading, setUserName } = authSlice.actions;
export default authSlice.reducer;