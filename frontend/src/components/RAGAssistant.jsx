import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Trash2, Send, Brain, BookOpen, Loader, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function RAGAssistant({ apiKey, onUnauthorized }) {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  
  const [genQuestions, setGenQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [genError, setGenError] = useState('');

  const [isAssetsOpen, setIsAssetsOpen] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch threads and documents on mount
  useEffect(() => {
    fetchThreads();
    fetchDocuments();
  }, []);

  // Fetch details when active thread changes
  useEffect(() => {
    if (activeThreadId) {
      fetchThreadDetails(activeThreadId);
    } else {
      setActiveThread(null);
    }
  }, [activeThreadId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, sendingMsg]);

  // Poll documents if any are in PENDING status
  useEffect(() => {
    const hasPending = documents.some(doc => doc.status === 'PENDING');
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.status === 401) {
          onUnauthorized();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          
          // Also check if the active thread details should be re-fetched to update attached documents
          const updatedHasPending = data.some(doc => doc.status === 'PENDING');
          if (!updatedHasPending && activeThreadId) {
            fetchThreadDetails(activeThreadId);
          }
        }
      } catch (err) {
        console.error('Error polling documents:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, activeThreadId]);

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/rag/threads');
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
        if (data.length > 0 && !activeThreadId) {
          setActiveThreadId(data[0].id);
        } else if (data.length === 0) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to load threads', err);
    }
  };

  const fetchThreadDetails = async (id) => {
    try {
      const res = await fetch(`/api/rag/threads/${id}`);
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data);
        const lastMsg = data.messages[data.messages.length - 1];
        if (lastMsg && lastMsg.role === 'model' && lastMsg.sources) {
          setLastSources(lastMsg.sources);
        } else {
          setLastSources([]);
        }
      }
    } catch (err) {
      console.error('Failed to load thread details', err);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/rag/threads', { method: 'POST' });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setThreads(prev => [data, ...prev]);
        setActiveThreadId(data.id);
      }
    } catch (err) {
      console.error('Failed to create new chat thread', err);
    }
  };

  const handleDeleteThread = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const res = await fetch(`/api/rag/threads/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== id));
        if (activeThreadId === id) {
          const remaining = threads.filter(t => t.id !== id);
          if (remaining.length > 0) {
            setActiveThreadId(remaining[0].id);
          } else {
            setActiveThreadId(null);
            handleNewChat();
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete thread', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    if (activeThreadId) {
      formData.append('threadId', activeThreadId);
    }

    try {
      const headers = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => {
          if (prev.some(d => d.id === data.doc.id)) {
            return prev;
          }
          return [...prev, data.doc];
        });
        setUploadProgress(data.message || `Successfully parsed & indexed ${file.name}!`);
        
        if (activeThreadId) {
          fetchThreadDetails(activeThreadId);
        }

        setTimeout(() => setUploadProgress(''), 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errData = await res.json();
        setUploadError(errData.error || 'Failed to upload document.');
        setUploadProgress('');
      }
    } catch (err) {
      setUploadError(`Upload error: ${err.message}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Are you sure you want to delete this document and its indexed vectors?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete document.');
      }
    } catch (err) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const handleToggleDocumentAttachment = async (docId) => {
    if (!activeThread) return;
    
    const currentSelected = activeThread.selectedDocuments || [];
    let updatedSelected;
    if (currentSelected.includes(docId)) {
      updatedSelected = currentSelected.filter(id => id !== docId);
    } else {
      updatedSelected = [...currentSelected, docId];
    }

    try {
      const res = await fetch(`/api/rag/threads/${activeThreadId}/documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedDocuments: updatedSelected })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (res.ok) {
        setActiveThread(prev => ({
          ...prev,
          selectedDocuments: updatedSelected
        }));
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            return { ...t, selectedDocuments: updatedSelected };
          }
          return t;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle document attachment', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendingMsg) return;

    let threadId = activeThreadId;
    if (!threadId) {
      await handleNewChat();
      return;
    }

    const userMsg = inputMessage;
    setInputMessage('');
    setSendingMsg(true);

    if (activeThread) {
      const optimisticMsg = {
        id: 'optimistic-u',
        role: 'user',
        text: userMsg,
        timestamp: new Date().toISOString()
      };
      setActiveThread(prev => ({
        ...prev,
        messages: [...(prev.messages || []), optimisticMsg]
      }));
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch(`/api/rag/threads/${threadId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        fetchThreadDetails(threadId);
        if (data.threadTitle) {
          setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: data.threadTitle } : t));
        }
      } else {
        setActiveThread(prev => ({
          ...prev,
          messages: [...(prev.messages || []), { role: 'model', text: `⚠️ Error: ${data.error || 'Failed to get response.'}` }]
        }));
      }
    } catch (err) {
      setActiveThread(prev => ({
        ...prev,
        messages: [...(prev.messages || []), { role: 'model', text: `⚠️ Network error: ${err.message}` }]
      }));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    setGenError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch('/api/rag/generate-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ count: 3, threadId: activeThreadId })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setGenQuestions(data.questions);
      } else {
        setGenError(data.error || 'Failed to generate prep questions.');
      }
    } catch (err) {
      setGenError(`Network error: ${err.message}`);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="slide-up" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', height: 'calc(100vh - 100px)', minHeight: 0 }}>
      
      {/* SIDEBAR: Thread list & Documents list toggle */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%', minHeight: 0, gap: '1rem' }}>
        
        {/* New Chat Trigger */}
        <button 
          onClick={handleNewChat}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Scrollable list of active threads */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.25rem' }}>
          {threads.map(t => {
            const isActive = t.id === activeThreadId;
            return (
              <div 
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                className="thread-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  <MessageSquare size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '0.88rem', 
                    fontWeight: isActive ? 600 : 500, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}>
                    {t.title}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleDeleteThread(t.id, e)}
                  style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', opacity: isActive ? 0.8 : 0 }}
                  className="thread-delete-btn"
                  title="Delete conversation"
                >
                  <Trash2 size={13} color="var(--error)" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Assets Drawer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <button 
            onClick={() => setIsAssetsOpen(!isAssetsOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              width: '100%', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '0.82rem', 
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} color="var(--secondary)" />
              <span>Uploaded Context ({documents.length})</span>
            </div>
            {isAssetsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {isAssetsOpen && (
            <div style={{ 
              maxHeight: '160px', 
              overflowY: 'auto', 
              marginTop: '0.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.4rem',
              paddingRight: '0.25rem'
            }}>
              {loadingDocs ? (
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <Loader size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                </div>
              ) : documents.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
                  No files uploaded. Use the '+' button in chat to add.
                </div>
              ) : (
                documents.map(doc => {
                  const isSelected = activeThread && activeThread.selectedDocuments && activeThread.selectedDocuments.includes(doc.id);
                  const isPending = doc.status === 'PENDING';
                  const isFailed = doc.status === 'FAILED';

                  let bg = 'rgba(0,0,0,0.2)';
                  let border = '1px solid var(--border-color)';
                  if (isSelected) {
                    bg = 'rgba(99, 102, 241, 0.1)';
                    border = '1px solid var(--primary)';
                  } else if (isPending) {
                    bg = 'rgba(245, 158, 11, 0.05)';
                    border = '1px dashed #d97706';
                  } else if (isFailed) {
                    bg = 'rgba(239, 68, 68, 0.05)';
                    border = '1px solid #ef4444';
                  }

                  return (
                    <div 
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: bg,
                        padding: '0.4rem 0.5rem',
                        borderRadius: '6px',
                        border: border,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '80%', overflow: 'hidden' }}>
                        {isPending ? (
                          <Loader size={12} color="#d97706" style={{ animation: 'spin 1.5s linear infinite', flexShrink: 0 }} />
                        ) : isFailed ? (
                          <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                        ) : (
                          activeThread && (
                            <input 
                              type="checkbox" 
                              checked={!!isSelected} 
                              onChange={() => handleToggleDocumentAttachment(doc.id)}
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          )
                        )}
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            color: isFailed ? '#ef4444' : isPending ? '#d97706' : 'var(--text-main)'
                          }}
                          title={doc.name}
                        >
                          {doc.name}
                          {isPending && <span style={{ fontSize: '0.65rem', marginLeft: '0.25rem', opacity: 0.8 }}>(Processing...)</span>}
                          {isFailed && <span style={{ fontSize: '0.65rem', marginLeft: '0.25rem', opacity: 0.8 }}>(Failed)</span>}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                        title="Delete asset"
                      >
                        <Trash2 size={12} color="var(--error)" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA: Active Chat View */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '1rem' }}>
        
        {/* Chat window panel */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', minHeight: 0, overflow: 'hidden' }}>
          
          {/* Chat Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Brain size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {activeThread ? activeThread.title : 'PrepAI Chat'}
              </h2>
              {activeThread && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  {activeThread.selectedDocuments?.length || 0} attached docs
                </span>
              )}
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              {generatingQuestions ? 'Generating...' : 'Gen Practice Questions'}
            </button>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
            {(!activeThread || !activeThread.messages || activeThread.messages.length === 0) ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Brain size={42} color="var(--primary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Start Conversing with PrepAI</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '440px', lineHeight: '1.5' }}>
                  Ask placement or coding questions, or upload study notes/documents using the **"+"** button to chat with context.
                </p>
              </div>
            ) : (
              activeThread.messages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    backgroundColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                    borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    padding: '0.8rem 1rem',
                    fontSize: '0.92rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    color: msg.text.startsWith('📁 [System Notification]') ? 'var(--secondary)' : 'var(--text-main)'
                  }}
                >
                  {msg.text}
                </div>
              ))
            )}
            {sendingMsg && (
              <div style={{ alignSelf: 'flex-start', padding: '0.8rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px 12px 12px 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                <Loader size={13} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>AI is searching vectors and typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Citations block */}
          {lastSources.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                <BookOpen size={11} />
                <span>RETRIEVED CITATIONS:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {lastSources.map((source, index) => (
                  <span 
                    key={index}
                    className="badge badge-primary"
                    style={{ fontSize: '0.68rem', display: 'flex', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                    title={`Cosine Similarity: ${source.similarity.toFixed(4)}`}
                  >
                    <span>{source.name}</span>
                    <span style={{ color: 'var(--secondary)' }}>({Math.round(source.similarity * 100)}% match)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Notification Bar */}
          {(uploading || uploadProgress || uploadError) && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {uploading && <Loader size={14} style={{ animation: 'spin 1.5s linear infinite' }} />}
              <span style={{ color: uploadError ? 'var(--error)' : 'var(--text-main)' }}>
                {uploadError || uploadProgress}
              </span>
            </div>
          )}

          {/* ChatGPT-style Chat Form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.4rem 0.6rem' }}>
            
            {/* ChatGPT upload "+" button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Add document (PDF, DOCX, TXT, MD)"
              className="chat-plus-button"
            >
              <Plus size={18} color="var(--primary)" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.txt,.md,.docx"
            />

            <input
              type="text"
              className="form-input"
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.4rem 0.2rem', outline: 'none', boxShadow: 'none' }}
              placeholder="Ask a general question, or upload study notes (PDF, DOCX, TXT, MD) using '+' to chat with context..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sendingMsg}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputMessage.trim() || sendingMsg}
              style={{ padding: '0.5rem', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justify: 'center' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Practice Questions Panel */}
        {(genQuestions.length > 0 || genError) && (
          <div className="glass-card slide-up" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Brain size={14} />
              <span>AI-Generated Questions from study material:</span>
            </h3>
            {genError ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{genError}</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {genQuestions.map((q, idx) => (
                  <div 
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(q);
                      alert('Copied question to clipboard!');
                    }}
                    title="Click to copy question"
                  >
                    <span>{idx + 1}. {q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .thread-row:hover .thread-delete-btn {
          opacity: 1 !important;
        }
        .chat-plus-button:hover {
          background: rgba(99, 102, 241, 0.15) !important;
        }
      `}} />
    </div>
  );
}
