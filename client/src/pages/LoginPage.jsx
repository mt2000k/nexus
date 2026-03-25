import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiMail, FiLock, FiUser } from 'react-icons/fi';

const AVATARS = ['😎', '🤖', '👾', '🦊', '🐱', '🦁', '🐸', '🐼', '🦄', '🧙', '👨‍💻', '👩‍💻'];

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, guestLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!username.trim() || !email.trim() || !password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        await register(username.trim(), email.trim(), password, avatar);
      } else {
        if (!email.trim() || !password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
        </div>

        <div className="login-logo">
          <h1>💬 NexusChat</h1>
          <p>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username"><FiUser style={{ marginRight: 4, verticalAlign: 'middle' }} /> Username</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Choose a username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email"><FiMail style={{ marginRight: 4, verticalAlign: 'middle' }} /> Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password"><FiLock style={{ marginRight: 4, verticalAlign: 'middle' }} /> Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Choose Avatar</label>
              <div className="avatar-selector">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                    onClick={() => setAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          {mode === 'login' && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', opacity: 0.5 }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--text-secondary)' }} />
                <span style={{ padding: '0 12px', fontSize: '0.85rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--text-secondary)' }} />
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ width: '100%' }}
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  try {
                    await guestLogin();
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                🎭 Join as Guest
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              type="button"
              style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
