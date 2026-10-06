import React, { useState } from 'react';
import AuthForm from '../components/AuthForm.jsx';
import TodoApp from '../components/TodoApp.jsx';

const TOKEN_KEY = 'todoToken';

export default function Home() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [message, setMessage] = useState('');

  function storeToken(nextToken) {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setMessage('');
    setToken(nextToken);
  }

  function clearSession(nextMessage = '') {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMessage(nextMessage);
  }

  if (!token) {
    return <AuthForm onAuthenticated={storeToken} message={message} />;
  }

  return <TodoApp token={token} onLogout={() => clearSession()} onUnauthorized={clearSession} />;
}
