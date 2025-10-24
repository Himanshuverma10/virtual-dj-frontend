// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStateObserver } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // This observer returns an unsubscribe function
    const unsubscribe = authStateObserver((user) => {
      setUser(user);
      setLoadingAuth(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loadingAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};