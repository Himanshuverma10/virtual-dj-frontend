// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authStateObserver } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // This observer returns an unsubscribe function
    const unsubscribe = authStateObserver((user) => {
      setUser(user);
      setLoadingAuth(false);
      if (newUser) { // Agar user login hua hai
        // Check karo ki kya humein kahin redirect karna tha?
        const origin = location.state?.from; 
        if (origin) {
          console.log("Login successful, redirecting back to:", origin);
          navigate(origin, { replace: true }); // Waapis uss page par bhejo
        }
      }
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