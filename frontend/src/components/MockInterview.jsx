import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Play, AlertTriangle, RefreshCw, Send, Sparkles, BookOpen, Laptop, Loader } from 'lucide-react';
import CodingWorkspace from './CodingWorkspace';
import EvaluationReport from './EvaluationReport';

export default function MockInterview({ apiKey, audioConfig, setActiveTab, onUnauthorized }) {
  const [stage, setStage] = useState('lobby'); // lobby, interview, report
  const [role, setRole] = useState('Frontend Engineer');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [useRAG, setUseRAG] = useState(false);
  const [hasDocs, setHasDocs] = useState(false);
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedTopic, setSelectedTopic] = useState('General');
  const [customTopic, setCustomTopic] = useState('');
  const [activeInterviews, setActiveInterviews] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserListening, setIsUserListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [tempTranscript, setTempTranscript] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  
  const [codingProblem, setCodingProblem] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [submittedLang, setSubmittedLang] = useState('javascript');
  const [submittedScratchpad, setSubmittedScratchpad] = useState('');

  const recognitionRef = useRef(null);

  // Check if documents are available for RAG & fetch in-progress interviews
  useEffect(() => {
    fetch('/api/documents')
      .then(res => {
        if (res.status === 401) {
          onUnauthorized();
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) setHasDocs(data.length > 0);
      })
      .catch(err => console.error('Error fetching docs count', err));

    fetch('/api/interviews')
      .then(res => {
        if (res.status === 401) return;
        return res.json();
      })
      .then(data => {
        if (data) {
          const active = data.filter(i => i.status === 'active');
          setActiveInterviews(active);
        }
      })
      .catch(err => console.error('Error fetching interviews', err));
  }, [stage]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsUserListening(true);
        };

        rec.onresult = (e) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              final += e.results[i][0].transcript + ' ';
            } else {
              interim += e.results[i][0].transcript;
            }
          }
          if (final) {
            setTranscript(prev => prev + final);
          }
          setTempTranscript(interim);
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error', e);
          if (e.error === 'no-speech') {
            // Keep listening, ignore temporary silence
          } else {
            setIsUserListening(false);
          }
        };

        rec.onend = () => {
          setIsUserListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start speech listening
  const startListening = () => {
    if (recognitionRef.current && !isUserListening && !isAISpeaking && !isMicMuted) {
      try {
        setTempTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  // Stop speech listening
  const stopListening = () => {
    if (recognitionRef.current && isUserListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition', err);
      }
    }
  };

  // Read question text aloud via SpeechSynthesis
  const speakQuestion = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel speech recognition while speaking to avoid feedback loop
      stopListening();
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (audioConfig.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === audioConfig.voiceURI);
        if (voice) utterance.voice = voice;
      }
      
      utterance.rate = audioConfig.rate || 1;
      utterance.pitch = audioConfig.pitch || 1;
      
      utterance.onstart = () => {
        setIsAISpeaking(true);
      };
      
      utterance.onend = () => {
        setIsAISpeaking(false);
        // Automatically start listening to the candidate once the AI finishes speaking
        setTimeout(() => {
          startListening();
        }, 300);
      };
      
      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error', e);
        setIsAISpeaking(false);
        startListening();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if SpeechSynthesis is not supported
      startListening();
    }
  };

  const handleResumeInterview = (interviewSession) => {
    setSession(interviewSession);
    setStage('interview');
    setTranscript('');
    setTempTranscript('');
    
    const lastQ = interviewSession.questions[interviewSession.questions.length - 1];
    if (interviewSession.type === 'DSA') {
      setCodingProblem(lastQ);
    } else {
      setCodingProblem('');
    }

    setTimeout(() => {
      speakQuestion(lastQ);
    }, 600);
  };

  const handleEndAndEvaluate = async () => {
    setLoading(true);
    setShowEndModal(false);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      const res = await fetch('/api/interviews/end-evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ interviewId: session.id })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSession(data);
        setStage('report');
      } else {
        alert(data.error || 'Failed to evaluate interview.');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExit = () => {
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
    setShowEndModal(false);
    setStage('lobby');
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch('/api/interviews/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          role, 
          type, 
          difficulty, 
          useRAG,
          topic: type === 'Technical' ? (selectedTopic === 'Custom' ? customTopic : selectedTopic) : 'General'
        })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setSession(data);
        setStage('interview');
        setTranscript('');
        setTempTranscript('');
        
        // Extract DSA problem if applicable
        if (type === 'DSA') {
          setCodingProblem(data.questions[0]);
        } else {
          setCodingProblem('');
        }

        // Delay voice slightly to ensure UI finishes mounting
        setTimeout(() => {
          speakQuestion(data.questions[0]);
        }, 600);
      } else {
        setError(data.error || 'Failed to start interview.');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (loading || isAISpeaking) return;
    
    // Stop recording
    stopListening();

    const fullAnswerText = (transcript + ' ' + tempTranscript).trim();
    if (!fullAnswerText && !submittedCode && !submittedScratchpad) {
      alert('Please speak your answer or write in the workspace (scratchpad/code board) before submitting.');
      startListening();
      return;
    }

    setLoading(true);
    setError('');

    // Attach code and/or scratchpad text as context to response
    let finalAnswerPayload = fullAnswerText;
    const attachments = [];
    if (submittedCode) {
      attachments.push(`[Candidate Submitted Code (${submittedLang})]:\n${submittedCode}`);
    }
    if (submittedScratchpad) {
      attachments.push(`[Candidate Written Notes/Scratchpad]:\n${submittedScratchpad}`);
    }
    if (attachments.length > 0) {
      finalAnswerPayload = `${fullAnswerText}\n\n${attachments.join('\n\n')}`.trim();
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch('/api/interviews/answer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          interviewId: session.id,
          answerText: finalAnswerPayload
        })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setSession(data);
        setTranscript('');
        setTempTranscript('');
        setSubmittedCode('');
        setSubmittedScratchpad('');
        
        if (data.status === 'completed') {
          // Interview completed, render evaluation report
          setStage('report');
        } else {
          // Go to next question
          const nextQ = data.questions[data.questions.length - 1];
          if (data.type === 'DSA') {
            setCodingProblem(nextQ);
          }
          speakQuestion(nextQ);
        }
      } else {
        setError(data.error || 'Failed to submit answer.');
        startListening();
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      startListening();
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      // Restart listening (safely triggers start)
      setTimeout(() => {
        if (!isAISpeaking && !isUserListening) {
          startListening();
        }
      }, 200);
    } else {
      setIsMicMuted(true);
      stopListening();
    }
  };

  // Skip or reset audio if synthesis gets stuck
  const handleResetAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
      startListening();
    }
  };

  if (stage === 'report') {
    return <EvaluationReport report={session.evaluation} setActiveTab={setActiveTab} onRestart={() => setStage('lobby')} />;
  }

  return (
    <div style={{ height: '100%' }}>
      {stage === 'lobby' ? (
        <div className="slide-up" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Sparkles size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>AI Mock Interview Lobby</h1>
            <p style={{ color: 'var(--text-muted)' }}>Simulate a realistic placement interview using advanced RAG and voice synthesis.</p>
          </div>

          {activeInterviews.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid var(--secondary)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} className="pulse-glow" style={{ animation: 'spin 4s linear infinite' }} />
                <span>Resume In-Progress Interview</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeInterviews.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.role} - {item.type} Round</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Topic: {item.topic || 'General'} | Difficulty: {item.difficulty} | Question {item.questionTypes ? item.questionTypes.filter(t => t === 'main').length : item.questions.length} of {item.maxQuestions}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResumeInterview(item)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                    >
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--error)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Target Job Role</label>
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Fullstack Engineer">Fullstack Engineer</option>
                  <option value="Software Development Engineer (SDE)">Software Development SDE</option>
                  <option value="System Architect">System Architect</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Interview Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Technical">General Technical</option>
                  <option value="DSA">Data Structures & Algorithms (DSA)</option>
                  <option value="System Design">System Design</option>
                  <option value="HR">HR Behavior Round</option>
                </select>
              </div>
            </div>

            {type === 'Technical' && (
              <div style={{ display: 'grid', gridTemplateColumns: selectedTopic === 'Custom' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Focus Topic</label>
                  <select className="form-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                    <option value="General">General / All-round</option>
                    <option value="OS">Operating Systems (OS)</option>
                    <option value="DBMS">Database Management Systems (DBMS)</option>
                    <option value="CN">Computer Networks (CN)</option>
                    <option value="MERN">MERN Stack</option>
                    <option value="Custom">Custom Topic...</option>
                  </select>
                </div>
                {selectedTopic === 'Custom' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Specify Topic</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. React, Node.js, C++"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      style={{ 
                        width: '100%', 
                        height: '42px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: 'var(--text-main)', 
                        padding: '0 0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Interview Difficulty</label>
                <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="Easy">Easy (Entry level questions)</option>
                  <option value="Medium">Medium (Standard engineering problems)</option>
                  <option value="Hard">Hard (FAANG caliber constraints)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <input
                    type="checkbox"
                    id="useRAG"
                    checked={useRAG}
                    onChange={(e) => setUseRAG(e.target.checked)}
                    disabled={!hasDocs}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: hasDocs ? 'pointer' : 'not-allowed' }}
                  />
                  <label htmlFor="useRAG" style={{ fontSize: '0.95rem', fontWeight: 500, color: hasDocs ? 'var(--text-main)' : 'var(--text-muted)', cursor: hasDocs ? 'pointer' : 'not-allowed' }}>
                    Contextualize with Knowledge Base
                  </label>
                </div>
                {!hasDocs && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    (No documents uploaded in Knowledge Base yet)
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw className="pulse-glow" size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span>Preparing AI Panel...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Start Interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Immersive Interview Environment */
        <div style={{ height: '100%' }}>
          <div className="ide-container slide-up">
            {/* Left pane: AI Interviewer */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%' }}>
              {renderVoicePanel()}
            </div>
            {/* Right pane: Workspace (Code Board, Scratchpad, Whiteboard) */}
            <CodingWorkspace 
              interviewType={session.type}
              problemStatement={codingProblem}
              questionIndex={session.questions.length}
              onCodeSubmit={(code, lang) => {
                setSubmittedCode(code);
                setSubmittedLang(lang);
                alert('Code attached! You can now speak or click "Submit Response" to finalize your answer.');
              }}
              onScratchpadSubmit={(text) => {
                setSubmittedScratchpad(text);
                alert('Notes attached! You can now speak or click "Submit Response" to finalize your answer.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  function renderVoicePanel() {
    const currentQuestion = session.questions[session.questions.length - 1];
    const totalQ = session.maxQuestions;
    const currentQIdx = session.questionTypes ? session.questionTypes.filter(t => t === 'main').length : session.questions.length;
    const isFollowUp = session.questionTypes && session.questionTypes[session.questionTypes.length - 1] === 'follow_up';
    const fullTextAnswer = (transcript + ' ' + tempTranscript).trim();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem', minHeight: 0 }}>
        {/* Status Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginRight: '0.5rem' }}>{session.type} Round</span>
            <span className="badge badge-secondary">{session.difficulty}</span>
            {isFollowUp && <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Follow-up</span>}
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Question {currentQIdx} of {totalQ}
          </span>
        </div>

        {/* AI Question Box */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
          <Volume2 size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Interviewer
            </h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', fontWeight: 500 }}>{currentQuestion}</p>
          </div>
        </div>

        {/* Soundwave/Avatar status visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0', gap: '1rem' }}>
          {isAISpeaking ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="sound-wave">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500, letterSpacing: '0.05em' }} className="pulse-glow-blue">
                INTERVIEWER IS SPEAKING...
              </span>
            </div>
          ) : isUserListening ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--error)' }}>
                <Mic size={22} color="var(--error)" />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 600, letterSpacing: '0.05em' }}>
                LISTENING (SPEAK NOW)
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                {isMicMuted ? <MicOff size={22} color="var(--text-muted)" /> : <Mic size={22} color="var(--text-muted)" />}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {isMicMuted ? 'MICROPHONE MUTED' : 'STANDBY'}
              </span>
            </div>
          )}
        </div>

        {/* Real-time Transcription window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '140px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>YOUR RESPONSE TRANSCRIPT</span>
            <span style={{ color: 'var(--error)' }}>* Speaking Only</span>
          </label>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(0,0,0,0.3)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '10px', 
              padding: '1rem',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              overflowY: 'auto',
              color: fullTextAnswer ? 'var(--text-main)' : 'var(--text-muted)',
              fontStyle: fullTextAnswer ? 'normal' : 'italic'
            }}
          >
            {fullTextAnswer ? (
              <>
                {transcript}
                <span style={{ color: 'var(--secondary)' }}>{tempTranscript}</span>
              </>
            ) : (
              'Your speech transcript will render here in real time as you talk. Speak clearly into your microphone.'
            )}
          </div>
        </div>

        {/* Speech control board */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={toggleMic}
              disabled={loading || isAISpeaking}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 0.8rem' }}
              title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMicMuted ? <Mic size={18} color="var(--error)" /> : <MicOff size={18} />}
            </button>
            <button
              onClick={handleResetAudio}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 0.8rem' }}
              title="Reset stuck audio synthesis"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowEndModal(true)}
              disabled={loading}
              className="btn btn-danger"
              style={{ padding: '0.6rem 1rem' }}
              title="End session early or save"
            >
              End Session
            </button>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={loading || isAISpeaking}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.75rem' }}
          >
            {loading ? (
              <>
                <Loader className="pulse-glow" size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Response</span>
              </>
            )}
          </button>
        </div>

        {/* Early Pause/Exit glass modal */}
        {showEndModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
          }}>
            <div className="glass-card slide-up" style={{ maxWidth: '450px', width: '90%', textAlign: 'center', border: '1px solid var(--primary-glow)' }}>
              <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Pause or End Interview?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Would you like to end the interview now and get evaluated on the questions answered so far, or save your progress to continue later?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={handleEndAndEvaluate}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                >
                  {loading ? 'Evaluating...' : 'End & Evaluate Now'}
                </button>
                <button
                  onClick={handleSaveAndExit}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                >
                  Save & Exit (Continue Later)
                </button>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
