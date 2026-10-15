import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';

const INITIAL_TESTS = [
  {
    id: 1,
    title: 'Основы JavaScript',
    description: 'Базовый тест по JS',
    questionsCount: 5,
    passingScore: 60,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'SQL для начинающих',
    description: 'SELECT и JOIN',
    questionsCount: 8,
    passingScore: 70,
    createdAt: new Date().toISOString()
  }
];

export default function TestList() {
  const [tests, setTests] = useLocalStorage('quiz-tests', INITIAL_TESTS);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionsCount, setQuestionsCount] = useState(5);
  const [passingScore, setPassingScore] = useState(60);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

const debouncedTitle = useDebounce(title, 500);
const [draftSaved, setDraftSaved] = useState(false);

useEffect(() => {
  if (debouncedTitle) {
    localStorage.setItem('quiz-draft', debouncedTitle);
    setDraftSaved(true);
    const t = setTimeout(() => setDraftSaved(false), 1500);
    return () => clearTimeout(t);
  }
}, [debouncedTitle]);

  useEffect(() => {
    document.title = `Тесты (${tests.length})`;
  }, [tests.length]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setQuestionsCount(5);
    setPassingScore(60);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      setTests(tests.map(t =>
        t.id === editingId
          ? { ...t, title, description, questionsCount: Number(questionsCount), passingScore: Number(passingScore) }
          : t
      ));
    } else {
      const newTest = {
        id: Date.now(),
        title,
        description,
        questionsCount: Number(questionsCount),
        passingScore: Number(passingScore),
        createdAt: new Date().toISOString()
      };
      setTests([newTest, ...tests]);
    }
    resetForm();
  };

  const handleEdit = (test) => {
    setEditingId(test.id);
    setTitle(test.title);
    setDescription(test.description);
    setQuestionsCount(test.questionsCount);
    setPassingScore(test.passingScore);
  };

  const handleDelete = (id) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const filtered = tests
    .filter(t => t.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const stats = {
    total: tests.length,
    withQuestions: tests.filter(t => t.questionsCount > 0).length,
    avgScore: tests.length
      ? Math.round(tests.reduce((s, t) => s + t.passingScore, 0) / tests.length)
      : 0
  };

  if (loading) {
    return <div className="loading">Загрузка тестов...</div>;
  }

  return (
    <div className="container">
      <h1>Платформа онлайн-тестирования</h1>

      <div className="stats">
        <span>Всего тестов: <b>{stats.total}</b></span>
        <span>С вопросами: <b>{stats.withQuestions}</b></span>
        <span>Средний проходной балл: <b>{stats.avgScore}%</b></span>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Название теста"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Вопросов"
          value={questionsCount}
          onChange={(e) => setQuestionsCount(e.target.value)}
        />
        <input
          type="number"
          placeholder="Проходной балл (%)"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
        />
        <button type="submit">
          {editingId ? 'Сохранить' : 'Добавить'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm}>Отмена</button>
        )}
      </form>

      <div className="controls">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="title">По названию</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Тестов не найдено</p>
      ) : (
        <ul className="list">
          {filtered.map(test => (
            <li key={test.id} className="item">
              <div>
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <small>
                  Вопросов: {test.questionsCount} • Проходной: {test.passingScore}%
                </small>
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