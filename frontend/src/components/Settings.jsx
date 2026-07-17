import React, { useState, useEffect } from 'react';
import { KeyRound, HelpCircle, Save, Volume2, ShieldAlert, Check } from 'lucide-react';

export default function Settings({ apiKey, setApiKey, audioConfig, setAudioConfig, onUnauthorized }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(audioConfig.voiceURI || '');
  const [rate, setRate] = useState(audioConfig.rate || 1);
  const [pitch, setPitch] = useState(audioConfig.pitch || 1);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearedMsg, setClearedMsg] = useState('');

  useEffect(() => {
    // Populate SpeechSynthesis voices
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synthVoices = window.speechSynthesis.getVoices();
        // Filter for English voices primarily to ensure standard pronunciations
        const englishVoices = synthVoices.filter(v => v.lang.toLowerCase().includes('en'));
        setVoices(englishVoices.length > 0 ? englishVoices : synthVoices);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    let cleanedKey = keyInput.trim();
    if (cleanedKey === 'undefined' || cleanedKey === 'null' || cleanedKey.includes(' ') || cleanedKey.length < 10) {
      cleanedKey = '';
    }

    localStorage.setItem('gemini_api_key', cleanedKey);
    setApiKey(cleanedKey);
    setKeyInput(cleanedKey);

    // Save key to MongoDB per-user
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanedKey })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
    } catch (err) {
      console.error('Failed to sync API key to database', err);
    }

    const activeVoice = voices.find(v => v.voiceURI === selectedVoice);
    const newAudioConfig = {
      voiceURI: selectedVoice,
      voiceName: activeVoice ? activeVoice.name : '',
      lang: activeVoice ? activeVoice.lang : 'en-US',
      rate: parseFloat(rate),
      pitch: parseFloat(pitch),
    };
    
    localStorage.setItem('speech_config', JSON.stringify(newAudioConfig));
    setAudioConfig(newAudioConfig);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearDb = async () => {
    if (!confirm('Are you sure you want to clear your data? This will permanently delete all your uploaded documents, interview records, evaluation reports, and roadmaps.')) {
      return;
    }
    
    setClearing(true);
    setClearedMsg('');
    try {
      const res = await fetch('/api/clear', { method: 'POST' });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        setClearedMsg('All your data has been cleared successfully.');
        setTimeout(() => setClearedMsg(''), 4000);
      } else {
        const data = await res.json();
        setClearedMsg(`Error: ${data.error || 'Failed to clear data.'}`);
      }
    } catch (err) {
      setClearedMsg(`Network Error: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="slide-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure credentials, speech models, and perform data maintenance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Credentials Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <KeyRound size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem' }}>Gemini Credentials</h2>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Gemini API Key
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <HelpCircle size={12} />
                Your key persists in MongoDB and falls back to server env settings when missing.
              </p>
            </div>

            {/* Speech synthesis options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginTop: '1rem' }}>
              <Volume2 size={22} color="var(--secondary)" />
              <h2 style={{ fontSize: '1.25rem' }}>Audio & Speech (Text-To-Speech)</h2>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Synthesizer Voice
              </label>
              <select
                className="form-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                <option value="">Default Browser Voice</option>
                {voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Speaking Speed: {rate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Pitch: {pitch}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--secondary)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              {saved ? (
                <>
                  <Check size={16} />
                  <span>Saved Settings!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* System & Maintenance Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <ShieldAlert size={22} color="var(--error)" />
            <h2 style={{ fontSize: '1.25rem' }}>System & Maintenance</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Performing a database reset will erase all placement logs, roadmap items, and indexed documents. This action is destructive and cannot be undone.
            </p>

            <button
              onClick={handleClearDb}
              disabled={clearing}
              className="btn btn-danger"
              style={{ alignSelf: 'flex-start' }}
            >
              {clearing ? 'Clearing Storage...' : 'Wipe Database'}
            </button>

            {clearedMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: clearedMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${clearedMsg.startsWith('Error') ? 'var(--error)' : 'var(--success)'}`,
                color: clearedMsg.startsWith('Error') ? '#fca5a5' : '#a7f3d0',
                fontSize: '0.9rem',
                marginTop: '0.5rem'
              }}>
                {clearedMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
