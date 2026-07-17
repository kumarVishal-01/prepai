import React, { useState } from 'react';
import { BrainCircuit, KeyRound, User, ArrowRight, Loader } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card slide-up" style={styles.card}>
        <div style={styles.logoContainer}>
          <BrainCircuit size={48} color="#6366f1" />
          <h1 style={styles.logoText}>PrepAI</h1>
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={styles.subtitle}>
            {isLogin
              ? 'Log in to access your mock interviews, roadmaps, and context files.'
              : 'Sign up to start simulating placement interviews and studying with RAG.'}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="text"
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="password"
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setUsername('');
              setPassword('');
            }}
          >
            {isLogin ? 'Register here' : 'Log in here'}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    width: '100%',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoText: {
    fontSize: '2rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    background: 'linear-gradient(to right, #ffffff, #6366f1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  error: {
    padding: '0.75rem 1rem',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid var(--error)',
    color: '#fca5a5',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-main)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '2.5rem',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '0.85rem',
    marginTop: '0.5rem',
  },
  toggleText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  toggleLink: {
    color: 'var(--primary)',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
