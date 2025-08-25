import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/api";
import { LoginForm } from "./components/LoginForm";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BooksPage } from "./pages/BooksPage";
import { MyBorrowingsPage } from "./pages/MyBorrowingsPage";
import { MyReservationsPage } from "./pages/MyReservationsPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication by calling /users/profile
    const checkAuth = async () => {
      try {
        await api.get("/users/profile");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return null; // Or a spinner

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/books" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-borrowings" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MyBorrowingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-reservations" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MyReservationsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
