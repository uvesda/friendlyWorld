import React, { createContext, useEffect, useState } from "react";
import { auth } from "@utils/auth";

export const AuthContext = createContext({
  isLoggedIn: false,
  loading: true,
  setAuthState: () => {}
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    loading: true
  });

 useEffect(() => {
    (async () => {
      try {
        const logged = await auth.isLoggedIn();
        setState({ 
          isLoggedIn: Boolean(logged), 
          loading: false 
        });
      } catch (error) {
        console.error('Auth error:', error);
        setState({ isLoggedIn: false, loading: false });
      }
    })();
  }, []);

  const setAuthState = (newState) => {
    setState(prev => ({ ...prev, ...newState }))
  }

  return (
    <AuthContext.Provider value={{ ...state, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};