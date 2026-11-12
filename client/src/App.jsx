import { useState, useEffect } from 'react';
import Login from './components/Login';
import TestList from './components/TestList';
import { authAPI } from './api'; // Убедитесь, что путь правильный!
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // При запуске проверяем, есть ли сохраненный токен
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    authAPI.profile()
      .then(res => setUser(res.data.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChecking(false));
  }, []);

  // Слушаем событие выхода (если токен протух)
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (checking) {
    return <div className="loading-screen">Проверка авторизации...</div>;
  }

  // Если пользователь не авторизован — показываем экран входа
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Если авторизован — показываем список тестов
  return <TestList user={user} onLogout={handleLogout} />;
}