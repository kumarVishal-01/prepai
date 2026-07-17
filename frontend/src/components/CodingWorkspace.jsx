import React, { useState, useEffect, useRef } from 'react';
import { Play, Send, Code, Terminal, BookOpen, AlertCircle, CheckCircle, RefreshCw, FileText, Palette, Trash2, Edit2, Eraser } from 'lucide-react';

const LANGUAGE_TEMPLATES = {
  javascript: `// JavaScript Solution
function findLongestPalindrome(s) {
  if (!s || s.length < 1) return "";
  let start = 0, end = 0;
  
  function expandAroundCenter(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return right - left - 1;
  }
  
  for (let i = 0; i < s.length; i++) {
    let len1 = expandAroundCenter(i, i);
    let len2 = expandAroundCenter(i, i + 1);
    let len = Math.max(len1, len2);
    if (len > end - start) {
      start = i - Math.floor((len - 1) / 2);
      end = i + Math.floor(len / 2);
    }
  }
  return s.substring(start, end + 1);
}

console.log("Result:", findLongestPalindrome("babad"));`,
  python: `# Python Solution
def find_longest_palindrome(s: str) -> str:
    if not s or len(s) < 1:
        return ""
    start, end = 0, 0
    
    def expand_around_center(left: int, right: int) -> int:
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return right - left - 1

    for i in range(len(s)):
        len1 = expand_around_center(i, i)
        len2 = expand_around_center(i, i + 1)
        length = max(len1, len2)
        if length > (end - start):
            start = i - (length - 1) // 2
            end = i + length // 2
            
    return s[start:end + 1]

print("Result:", find_longest_palindrome("babad"))`,
  cpp: `// C++ Solution
#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int expandAroundCenter(string s, int left, int right) {
    while (left >= 0 && right < s.length() && s[left] == s[right]) {
        left--;
        right++;
    }
    return right - left - 1;
}

string longestPalindrome(string s) {
    if (s.empty()) return "";
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        int len1 = expandAroundCenter(s, i, i);
        int len2 = expandAroundCenter(s, i, i + 1);
        int len = max(len1, len2);
        if (len > end - start) {
            start = i - (len - 1) / 2;
            end = i + len / 2;
        }
    }
    return s.substr(start, end - start + 1);
}

int main() {
    cout << "Result: " << longestPalindrome("babad") << endl;
    return 0;
}`,
  java: `// Java Solution
public class Solution {
    private static int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }

    public static String longestPalindrome(String s) {
        if (s == null || s.length() < 1) return "";
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > end - start) {
                start = i - (len - 1) / 2;
                end = i + len / 2;
            }
        }
        return s.substring(start, end + 1);
    }

    public static void main(String[] args) {
        System.out.println("Result: " + longestPalindrome("babad"));
    }
}`
};

export default function CodingWorkspace({ interviewType, problemStatement, questionIndex, onCodeSubmit, onScratchpadSubmit }) {
  const [activeTab, setActiveTab] = useState('code');
  
  // Code Board States
  const [lang, setLang] = useState('javascript');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.javascript);
  const [stdout, setStdout] = useState('Write code and click "Run Code" to compile.');
  const [isRunning, setIsRunning] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  // Scratchpad States
  const [scratchpadText, setScratchpadText] = useState('');

  // Whiteboard Canvas States
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen'); // pen, eraser

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Set default active tab based on interview round type
  useEffect(() => {
    if (interviewType === 'DSA') {
      setActiveTab('code');
    } else if (interviewType === 'System Design') {
      setActiveTab('whiteboard');
    } else {
      setActiveTab('scratchpad');
    }
  }, [interviewType]);

  // Synchronize language templates for code editor
  useEffect(() => {
    setCode(LANGUAGE_TEMPLATES[lang]);
    setStdout('Template loaded. Write code and click "Run Code" to compile.');
    setEvaluation(null);
  }, [lang]);

  // Reset scratchpad, stdout, evaluation, and whiteboard canvas on question change
  useEffect(() => {
    setScratchpadText('');
    setStdout('Write code or draw on the whiteboard.');
    setEvaluation(null);
    clearCanvas();
  }, [questionIndex]);

  // Adjust line numbers count when code edits occur
  const getLineCount = () => code.split('\n').length;
  const lineNumbersArray = Array.from({ length: getLineCount() }, (_, i) => i + 1);

  // Sync scroll of line numbers and editor
  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Keep tabs functioning in textarea instead of losing focus
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      
      setCode(newVal);
      
      // Reset cursor position after state change
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Handle Scratchpad Changes (propagates to parent automatically)
  const handleScratchpadChange = (e) => {
    const text = e.target.value;
    setScratchpadText(text);
    onScratchpadSubmit(text);
  };

  // Run code implementation
  const handleRunCode = async () => {
    setIsRunning(true);
    setStdout('Running tests...');
    setEvaluation(null);

    // Client-side local compiler sandbox for JavaScript
    if (lang === 'javascript') {
      try {
        const logs = [];
        const originalLog = console.log;
        // Mock console log
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        };

        // Run JavaScript via function sandbox
        const runner = new Function(code);
        runner();
        
        console.log = originalLog; // Restore console log
        
        setStdout(logs.join('\n') || 'Code completed execution (no output generated).');
      } catch (err) {
        setStdout(`Runtime Error: ${err.message}`);
      }
    }

    // Call backend evaluator (AI simulation) to verify constraints and complexities
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      const headers = { 'Content-Type': 'application/json' };
      if (savedKey) {
        headers['x-api-key'] = savedKey;
      }

      const res = await fetch('/api/interviews/code-run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          language: lang,
          problemStatement
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
        
        if (lang !== 'javascript') {
          // Fill output with simulated execution logs
          setStdout(data.simulatedStdout || 'Running tests...');
        }
      } else {
        const errData = await res.json();
        setStdout(prev => `${prev}\n\n[Evaluation Alert]: ${errData.error || 'Failed to analyze constraints.'}`);
      }
    } catch (err) {
      setStdout(prev => `${prev}\n\n[Network Alert]: Evaluation request failed.`);
    } finally {
      setIsRunning(false);
    }
  };

  // Canvas Whiteboard Drawing Handlers
  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#090d16' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;
    
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current || !contextRef.current) return;
    if (e.touches) e.preventDefault(); // Stop scrolling on mobile
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = contextRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Resize canvas without wiping existing drawings
  const handleResize = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;

      context.drawImage(tempCanvas, 0, 0);
    }
  };

  // Watch tab switch and window resize
  useEffect(() => {
    if (activeTab === 'whiteboard') {
      const timer = setTimeout(() => {
        handleResize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', minHeight: 0 }}>
      {/* IDE Editor Pane */}
      <div className="ide-editor-wrapper" style={{ flex: 1, minHeight: 0 }}>
        
        {/* Editor Toolbar with Workspace Tabs & Actions */}
        <div className="ide-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', height: '100%' }}>
            <button
              onClick={() => setActiveTab('code')}
              className={`workspace-tab ${activeTab === 'code' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'code' ? '#0d1117' : 'transparent',
                border: 'none',
                color: activeTab === 'code' ? 'var(--primary)' : 'var(--text-muted)',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === 'code' ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              <Code size={14} />
              <span>Code Board</span>
            </button>

            <button
              onClick={() => setActiveTab('scratchpad')}
              className={`workspace-tab ${activeTab === 'scratchpad' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'scratchpad' ? '#0d1117' : 'transparent',
                border: 'none',
                color: activeTab === 'scratchpad' ? 'var(--primary)' : 'var(--text-muted)',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === 'scratchpad' ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              <FileText size={14} />
              <span>Scratchpad</span>
            </button>

            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`workspace-tab ${activeTab === 'whiteboard' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'whiteboard' ? '#0d1117' : 'transparent',
                border: 'none',
                color: activeTab === 'whiteboard' ? 'var(--primary)' : 'var(--text-muted)',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === 'whiteboard' ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              <Palette size={14} />
              <span>Whiteboard</span>
            </button>
          </div>

          {/* Right side actions based on current active tab */}
          {activeTab === 'code' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select 
                className="form-select" 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#090d16', width: 'auto' }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                {isRunning ? (
                  <RefreshCw size={14} className="pulse-glow" style={{ animation: 'spin 1.5s linear infinite' }} />
                ) : (
                  <Play size={14} />
                )}
                <span>Run Code</span>
              </button>

              <button
                onClick={() => onCodeSubmit(code, lang)}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                <Send size={14} />
                <span>Attach Code</span>
              </button>
            </div>
          )}

          {activeTab === 'scratchpad' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => { setScratchpadText(''); onScratchpadSubmit(''); }}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                <Trash2 size={14} />
                <span>Clear Notes</span>
              </button>
              <button
                onClick={() => {
                  onScratchpadSubmit(scratchpadText);
                  alert('Scratchpad notes successfully attached to answer!');
                }}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                <Send size={14} />
                <span>Attach Notes</span>
              </button>
            </div>
          )}

          {activeTab === 'whiteboard' && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={clearCanvas}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                <Trash2 size={14} />
                <span>Clear Board</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          
          {/* Code Editor Tab */}
          <div style={{ display: activeTab === 'code' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1 }}>
            {/* Textarea Editor core */}
            <div className="ide-textarea-container" style={{ flex: 1, minHeight: 0 }}>
              <div ref={lineNumbersRef} className="ide-line-numbers">
                {lineNumbersArray.map(ln => (
                  <div key={ln}>{ln}</div>
                ))}
              </div>
              
              <textarea
                ref={textareaRef}
                className="ide-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck="false"
              />
            </div>

            {/* AI Coding analysis panel */}
            {evaluation && (
              <div style={{
                background: 'rgba(99,102,241,0.04)',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                padding: '0.75rem 1rem',
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                gap: '1rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                    <CheckCircle size={13} color="var(--success)" />
                    <span>CORRECTNESS</span>
                  </div>
                  <div style={{ fontWeight: 500, color: evaluation.correctness.status === 'Accepted' ? '#10b981' : '#ef4444' }}>
                    {evaluation.correctness.status}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                    {evaluation.correctness.explanation}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                    <BookOpen size={13} color="var(--primary)" />
                    <span>COMPLEXITY</span>
                  </div>
                  <div>Time: <span style={{ color: '#fff', fontWeight: 500 }}>{evaluation.complexity.time}</span></div>
                  <div>Space: <span style={{ color: '#fff', fontWeight: 500 }}>{evaluation.complexity.space}</span></div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                    <Terminal size={13} color="var(--secondary)" />
                    <span>CODE QUALITY</span>
                  </div>
                  <div>Quality Score: <span style={{ color: '#fff', fontWeight: 500 }}>{evaluation.codeQuality.score}/100</span></div>
                  {evaluation.codeQuality.suggestions && evaluation.codeQuality.suggestions.length > 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      💡 {evaluation.codeQuality.suggestions[0]}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stdout Console */}
            <div className="ide-console">
              <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem' }}>
                CONSOLE STDOUT
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{stdout}</pre>
            </div>
          </div>

          {/* Scratchpad Tab */}
          <div style={{ display: activeTab === 'scratchpad' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1 }}>
            <textarea
              className="scratchpad-textarea"
              value={scratchpadText}
              onChange={handleScratchpadChange}
              placeholder="Use this scratchpad to organize your thoughts, write down system architectures, database schemas, or general text explanations. 

Notes are automatically saved and attached to your response as you write!"
              spellCheck="false"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#c9d1d9',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                padding: '1.5rem',
                resize: 'none',
                outline: 'none',
                overflowY: 'auto'
              }}
            />
          </div>

          {/* Whiteboard Canvas Tab */}
          <div style={{ display: activeTab === 'whiteboard' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, position: 'relative' }}>
            {/* Whiteboard Controls Overlay */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '12px', 
                background: 'rgba(16, 22, 37, 0.85)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '0.4rem 0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                zIndex: 10
              }}
            >
              {/* Pen / Eraser */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setTool('pen')}
                  style={{
                    background: tool === 'pen' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.3rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem'
                  }}
                  title="Draw Pen"
                >
                  <Edit2 size={12} />
                  <span>Pen</span>
                </button>

                <button
                  onClick={() => setTool('eraser')}
                  style={{
                    background: tool === 'eraser' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.3rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem'
                  }}
                  title="Eraser"
                >
                  <Eraser size={12} />
                  <span>Eraser</span>
                </button>
              </div>

              <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }}></div>

              {/* Color Presets */}
              {tool === 'pen' && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: color === c ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        padding: 0,
                        transform: color === c ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.1s ease'
                      }}
                    />
                  ))}
                </div>
              )}

              {tool === 'pen' && <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }}></div>}

              {/* Size slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Size</span>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  style={{ width: '60px', accentColor: 'var(--primary)', height: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-main)', width: '25px', textAlign: 'center' }}>{brushSize}px</span>
              </div>
            </div>

            {/* Canvas Blackboard */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#090d16', overflow: 'hidden' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  cursor: tool === 'eraser' ? 'cell' : 'crosshair'
                }}
              />
            </div>
          </div>

        </div>
      </div>
      
      {/* Help card */}
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <AlertCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          <strong>Candidate Workspace:</strong> You can code solutions in <strong>Code Board</strong>, structure architecture or text answers in <strong>Scratchpad</strong>, or sketch diagrams on the <strong>Whiteboard</strong>. 
          Both Code and Scratchpad notes are compiled as part of your written context and submitted automatically when answering.
        </p>
      </div>
    </div>
  );
}
