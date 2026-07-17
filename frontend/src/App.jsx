import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MockInterview from './components/MockInterview';
import RAGAssistant from './components/RAGAssistant';
import LearningRoadmap from './components/LearningRoadmap';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { Loader } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [audioConfig, setAudioConfig] = useState({
    voiceURI: '',
    voiceName: '',
    lang: 'en-US',
    rate: 1,
    pitch: 1
  });

  // Check auth session & load configuration on mount
  useEffect(() => {
    checkSession();

    const savedAudio = localStorage.getItem('speech_config');
    if (savedAudio) {
      try {
        setAudioConfig(JSON.parse(savedAudio));
      } catch (e) {
        console.error('Failed to parse speech config', e);
      }
    }
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // Sync API key: check MongoDB first, then fallback to local storage
        let serverKey = data.user.geminiApiKey;
        if (serverKey) {
          serverKey = serverKey.trim();
          if (serverKey === 'undefined' || serverKey === 'null' || serverKey.includes(' ') || serverKey.length < 10) {
            serverKey = null;
          }
        }

        if (serverKey) {
          localStorage.setItem('gemini_api_key', serverKey);
          setApiKey(serverKey);
        } else {
          let savedKey = localStorage.getItem('gemini_api_key');
          if (savedKey) {
            savedKey = savedKey.trim();
            if (savedKey === 'undefined' || savedKey === 'null' || savedKey.includes(' ') || savedKey.length < 10) {
              savedKey = null;
            }
          }
          if (savedKey) {
            setApiKey(savedKey);
            // Save it to MongoDB backend as a sync action
            fetch('/api/user/api-key', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: savedKey })
            }).catch(e => console.error('Failed to auto-sync key to database', e));
          } else {
            localStorage.removeItem('gemini_api_key');
            setApiKey('');
          }
        }
      } else {
        setUser(null);
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
      }
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    let serverKey = userData.geminiApiKey;
    if (serverKey) {
      serverKey = serverKey.trim();
      if (serverKey === 'undefined' || serverKey === 'null' || serverKey.includes(' ') || serverKey.length < 10) {
        serverKey = null;
      }
    }

    if (serverKey) {
      localStorage.setItem('gemini_api_key', serverKey);
      setApiKey(serverKey);
    } else {
      let savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        savedKey = savedKey.trim();
        if (savedKey === 'undefined' || savedKey === 'null' || savedKey.includes(' ') || savedKey.length < 10) {
          savedKey = null;
        }
      }
      if (savedKey) {
        setApiKey(savedKey);
        fetch('/api/user/api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: savedKey })
        }).catch(e => console.error('Failed to sync API key on login', e));
      } else {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Failed to clear session on backend', e);
    }
    setUser(null);
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setActiveTab('dashboard');
  };

  const handleUnauthorized = () => {
    setUser(null);
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
  };

  // Simple view switcher
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} onUnauthorized={handleUnauthorized} />;
      case 'interview':
        return (
          <MockInterview
            apiKey={apiKey}
            audioConfig={audioConfig}
            setActiveTab={setActiveTab}
            onUnauthorized={handleUnauthorized}
          />
        );
      case 'rag':
        return <RAGAssistant apiKey={apiKey} onUnauthorized={handleUnauthorized} />;
      case 'roadmap':
        return <LearningRoadmap apiKey={apiKey} setActiveTab={setActiveTab} onUnauthorized={handleUnauthorized} />;
      case 'settings':
        return (
          <Settings
            apiKey={apiKey}
            setApiKey={setApiKey}
            audioConfig={audioConfig}
            setAudioConfig={setAudioConfig}
            onUnauthorized={handleUnauthorized}
          />
        );
      default:
        return <Dashboard setActiveTab={setActiveTab} onUnauthorized={handleUnauthorized} />;
    }
  };

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '0.75rem', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
        <span style={{ fontSize: '1.1rem' }}>Verifying PrepAI Secure Session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Dynamic background glow rings */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiKey={apiKey}
        user={user}
        onLogout={handleLogout}
      />
      
      {/* Main Panel */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
