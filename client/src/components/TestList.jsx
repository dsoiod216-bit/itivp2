import { useState, useEffect } from 'react';
import { testsAPI } from '../api';
import { useDebounce } from '../hooks/useDebounce';

export default function TestList({ user, onLogout }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(60);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const loadTests = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
  
      const res = await testsAPI.getAll(search);
      setTests(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить тесты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests(debouncedSearch);
  }, [debouncedSearch]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPassingScore(60);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title,
      description,
      passingScore: Number(passingScore),
      timeLimit: 600
    };

    if (editingId) {
      const old = tests.find(t => t.id === editingId);
      setTests(tests.map(t => t.id === editingId ? { ...t, ...data } : t));
      resetForm();

      try {
        await testsAPI.update(editingId, data);
        loadTests(debouncedSearch); 
      } catch (err) {
        setTests(tests.map(t => t.id === editingId ? old : t));
        setError(err.response?.data?.error || 'Не удалось обновить тест');
      }
    } else {
      const tempId = Date.now();
      const optimistic = { id: tempId, ...data, createdAt: new Date().toISOString() };
      setTests([optimistic, ...tests]);
      resetForm();

      try {
        const res = await testsAPI.create(data);
        const created = res.data.data;
        setTests(prev => prev.map(t => t.id === tempId ? { ...t, ...created } : t));
      } catch (err) {
        setTests(prev => prev.filter(t => t.id !== tempId));
        setError(err.response?.data?.error || 'Не удалось добавить тест');
      }
    }
  };

  const handleDelete = async (id) => {
    const removed = tests.find(t => t.id === id);
    setTests(tests.filter(t => t.id !== id));

    try {
      await testsAPI.remove(id);
    } catch (err) {
      setTests(prev => [removed, ...prev]);
      setError(err.response?.data?.error || 'Не удалось удалить тест');
    }
  };

  const handleEdit = (test) => {
    setEditingId(test.id);
    setTitle(test.title);
    setDescription(test.description || '');
    setPassingScore(test.passingScore);
  };

  if (loading && tests.length === 0) {
    return <div className="container"><div className="loading">Загрузка тестов...</div></div>;
  }

  if (error && tests.length === 0) {
    return (
      <div className="container">
        <div className="error">
          {error}
          <button onClick={() => loadTests(debouncedSearch)}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Платформа онлайн-тестирования</h1>
        <div className="user-info">
          <span>{user.email} ({user.role})</span>
          <button onClick={onLogout} className="btn-logout">Выйти</button>
        </div>
      </header>

      {error && (
        <div className="error-bar">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <input type="text" placeholder="Название теста" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="text" placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="number" placeholder="Проходной балл (%)" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
        <button type="submit">{editingId ? 'Сохранить' : 'Добавить'}</button>
        {editingId && <button type="button" onClick={resetForm}>Отмена</button>}
      </form>

      <div className="controls">
        {/* Ввод поиска */}
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {loading && <span className="searching">Поиск...</span>}
      </div>

      {tests.length === 0 && !loading ? (
        <p className="empty">Тестов не найдено</p>
      ) : (
        <ul className="list">
          {tests.map(test => (
            <li key={test.id} className="item">
              <div>
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <small>Проходной: {test.passingScore}%</small>
              </div>
              <div className="actions">
                <button onClick={() => handleEdit(test)}>✏️</button>
                <button onClick={() => handleDelete(test.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}