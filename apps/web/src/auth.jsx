import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export const AUTH_TOKEN_KEY = 'authToken';

const AuthContext = createContext(null);

function readStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);

  const login = useCallback((nextToken) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken('');
  }, []);

  const value = useMemo(() => ({ token, isAuthenticated: Boolean(token), login, logout }), [login, logout, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider');
  return auth;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
