
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Axios client module instance targeting the student wallet backend
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/wallet_api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Async request interceptor retrieving user token and appending Bearer authorization
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;