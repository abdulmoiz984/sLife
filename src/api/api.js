import axios from 'axios';
import { MMKV } from 'react-native-mmkv';
import { QueryClient } from '@tanstack/react-query';
//----
import { API_DOMAIN } from './endpoints';
import { showMessage } from '../utils';
import { AUTH_APIS_DISABLED, KEYS } from '../constants';

/** Do not retry client errors (403, 401, 404, …) — avoids stuck spinners + repeat toasts. */
const shouldRetryQuery = (failureCount, error) => {
  const status = error?.response?.status;
  if (status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 2;
};

// Query Constructor:
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Storage Constructor:
export const storage = new MMKV();

const api = axios.create({
  baseURL: API_DOMAIN,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const token = storage.getString(KEYS.ACCESS_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

const isPublicAuthUrl = url => {
  const path = String(url || '');
  return (
    path.includes('login') ||
    path.includes('register') ||
    path.includes('forgot-password') ||
    path.includes('reset-password')
  );
};

api.interceptors.response.use(
  res => res,
  err => {
    const error = err.response;
    const requestUrl = err?.config?.url;
    console.log('Error in Axios Response Instance: ', error);

    if (error?.status === 500) {
      showMessage({
        type: 'danger',
        message:
          error?.data?.message ||
          error?.data?.error ||
          'Something went wrong please try again',
      });
    }

    if (error?.status === 401) {
      // Doc: 401 → clear token and send user to login (skip public auth routes)
      if (!isPublicAuthUrl(requestUrl)) {
        storage.delete(KEYS.ACCESS_TOKEN);
        storage.delete(KEYS.CREDENTIALS);
        if (!AUTH_APIS_DISABLED) {
          showMessage({
            type: 'danger',
            message: error?.data?.message || 'Unauthenticated.',
          });
        }
        try {
          const { reset } = require('../navigation/NavigationService');
          reset('LoginScreen');
        } catch (_) {
          // navigation may not be ready during boot
        }
      }
    } else if (error?.status === 400) {
      if (!AUTH_APIS_DISABLED) {
        showMessage({
          type: 'danger',
          message: error?.data?.message || 'Something went wrong! Bad Request',
        });
      }
    }

    if (error?.status === 404) {
      showMessage({
        type: 'danger',
        message: error?.data?.message || 'Request not found!',
      });
    }

    if (error?.status === 403) {
      if (!AUTH_APIS_DISABLED) {
        showMessage({
          type: 'danger',
          message: error?.data?.message || 'Forbidden!',
        });
      }
    }

    if (error?.status === 429) {
      showMessage({
        type: 'danger',
        message:
          error?.data?.message || 'Too many requests. Please try again later.',
      });
    }

    return Promise.reject(err);
  },
);

export default api;
