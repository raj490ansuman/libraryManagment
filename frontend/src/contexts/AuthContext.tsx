import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on initial render
  const loadUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await api.post('/users/login', { email, password });
      const userData = response.data.user;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    return loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
