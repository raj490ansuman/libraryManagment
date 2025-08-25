import axios, { 
  AxiosInstance, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from "axios";

// Use ngrok URL for dev, Vercel deployed URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is required for sessions to work
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add any common headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No need to manually add tokens, sessions are handled automatically
    // via cookies that are sent with each request
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<never> => {
    // Handle 401 Unauthorized by redirecting to login
    if (error.response?.status === 401) {
      // If we're not already on the login page, redirect there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
