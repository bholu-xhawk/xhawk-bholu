import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { apiRequest } from '../lib/api.js';

const STORAGE_KEY = 'todo_jwt';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(STORAGE_KEY));

  const saveToken = useCallback((nextToken) => {
    if (nextToken) {
      window.localStorage.setItem(STORAGE_KEY, nextToken);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
      saveToken(data.token);
      return data;
    },
    [saveToken]
  );

  const signup = useCallback(
    async ({ email, password, name }) => {
      await apiRequest('/auth/signup', { method: 'POST', body: { email, password, name: name || undefined } });
      return login({ email, password });
    },
    [login]
  );

  const logout = useCallback(() => saveToken(null), [saveToken]);

  const value = useMemo(
    () => ({ token, isAuthenticated: Boolean(token), login, signup, logout, clearSession: logout }),
    [token, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
