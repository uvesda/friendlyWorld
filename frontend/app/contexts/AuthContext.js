import React, { createContext, useEffect, useState } from "react";
import { auth } from "@utils/auth";

export const AuthContext = createContext({
  isLoggedIn: false,
  loading: true
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    loading: true
  });

  useEffect(() => {
    (async () => {
      const logged = await auth.isLoggedIn();
      setState({ isLoggedIn: logged, loading: false });
    })();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};