import React, { createContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage + sync photoURL from Firebase session
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsed = JSON.parse(userData);
      setIsAuthenticated(true);
      setUser(parsed);
    }
    setIsLoading(false);

    // Listen to Firebase auth state — grab photoURL whenever it's available
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.photoURL) {
        setUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, photoURL: firebaseUser.photoURL };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for storage changes (useful if user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      console.log('Google user:', { email: firebaseUser.email, name: firebaseUser.displayName, uid: firebaseUser.uid });
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      console.log('Sending to backend:', {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseUid: firebaseUser.uid,
      });
      
      // Send to backend to create/find user and get JWT token
      const response = await authAPI.googleAuth({
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseUid: firebaseUser.uid,
        idToken: idToken,
      });
      
      console.log('Backend response:', response.data);
      
      // Store JWT token and user data — include photoURL from Firebase
      login(response.data.token, {
        ...response.data.user,
        photoURL: firebaseUser.photoURL || null,
      });
      
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Google login error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || error.message || 'Google login failed');
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
