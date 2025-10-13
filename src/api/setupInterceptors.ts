import apiClient from './client';
import { Store } from '@reduxjs/toolkit';

const setupInterceptors = (store: Store) => {
  apiClient.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.userToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;