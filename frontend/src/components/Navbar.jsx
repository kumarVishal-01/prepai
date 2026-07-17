import React from 'react';
import { LayoutDashboard, Mic, MessageSquare, Map, Settings, BrainCircuit, KeyRound, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiKey, user, onLogout }) {
  const hasKey = !!apiKey && apiKey !== 'undefined';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'interview', label: 'Mock Interview', icon: Mic },
    { id: 'rag', label: 'Chat', icon: MessageSquare },
    { id: 'roadmap', label: 'Learning Path', icon: Map },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer} onClick={() => setActiveTab('dashboard')}>
        <BrainCircuit size={28} color="#6366f1" />
        <span style={styles.logoText}>PrepAI</span>
      </div>
      
      <nav style={styles.nav}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navBtn,
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                borderColor: isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: isActive ? '#f3f4f6' : '#9ca3af'
              }}
            >
              <Icon size={20} color={isActive ? '#6366f1' : '#9ca3af'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footerPanels}>
        <div style={styles.statusPanel}>
          <div style={styles.statusHeader}>
            <KeyRound size={16} color="#9ca3af" />
            <span style={styles.statusTitle}>Gemini API</span>
          </div>
          {hasKey ? (
            <div style={styles.keyOk}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 500 }}>Configured</span>
            </div>
          ) : (
            <div style={styles.keyWarn} onClick={() => setActiveTab('settings')}>
              <AlertCircle size={14} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}>
                Missing Key
              </span>
            </div>
          )}
        </div>

        <div style={styles.userPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {user?.username?.substring(0, 2) || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authenticated</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              ...styles.navBtn,
              padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              justifyContent: 'center',
              width: '100%',
              marginTop: '0.25rem'
            }}
            className="navbar-logout-btn"
          >
            <LogOut size={14} color="#fca5a5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ffcdd2 !important;
        }
      `}} />
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'rgba(11, 15, 27, 0.8)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    backdropFilter: 'blur(20px)',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem',
    paddingLeft: '0.5rem',
    cursor: 'pointer',
  },
  logoText: {
    fontSize: '1.4rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    background: 'linear-gradient(to right, #ffffff, #6366f1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    fontSize: '0.95rem',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  footerPanels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: 'auto',
  },
  statusPanel: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  keyOk: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  keyWarn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  userPanel: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
  }
};
