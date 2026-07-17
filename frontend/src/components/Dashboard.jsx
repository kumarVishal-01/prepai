import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Mic, BookOpen, AlertTriangle, Calendar, Award, BarChart2, MessageSquare, Flame } from 'lucide-react';
import EvaluationReport from './EvaluationReport';

// Custom Area Chart component in SVG
function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  
  const width = 600;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  // Prepare data coordinates
  const points = data.map((item, index) => {
    const x = paddingLeft + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
    
    // Scores are 0 to 100
    const yTech = paddingTop + chartHeight - (item.technicalScore / 100) * chartHeight;
    const yComm = paddingTop + chartHeight - (item.communicationScore / 100) * chartHeight;
    const yConf = paddingTop + chartHeight - (item.confidenceScore / 100) * chartHeight;
    
    return { x, yTech, yComm, yConf, dateStr: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  });

  // Helper to build SVG path
  const buildPath = (key) => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x - 10} ${points[0][key]} L ${points[0].x + 10} ${points[0][key]}`;
    }
    return points.reduce((path, p, i) => {
      return path + `${i === 0 ? 'M' : 'L'} ${p.x} ${p[key]}`;
    }, '');
  };

  const buildAreaPath = (key) => {
    if (points.length === 0) return '';
    const linePath = buildPath(key);
    if (points.length === 1) return '';
    const baselineY = paddingTop + chartHeight;
    return `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
  };

  const techPath = buildPath('yTech');
  const commPath = buildPath('yComm');
  const confPath = buildPath('yConf');

  const techArea = buildAreaPath('yTech');
  const commArea = buildAreaPath('yComm');
  const confArea = buildAreaPath('yConf');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--success)" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="var(--success)" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map((val) => {
        const y = paddingTop + chartHeight - (val / 100) * chartHeight;
        return (
          <g key={val}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Area fills */}
      {techArea && <path d={techArea} fill="url(#techGrad)" />}
      {commArea && <path d={commArea} fill="url(#commGrad)" />}
      {confArea && <path d={confArea} fill="url(#confGrad)" />}

      {/* Lines */}
      {techPath && <path d={techPath} fill="none" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" />}
      {commPath && <path d={commPath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />}
      {confPath && <path d={confPath} fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" />}

      {/* Points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.yTech} r="4" fill="var(--bg-dark)" stroke="var(--secondary)" strokeWidth="2" />
          <circle cx={p.x} cy={p.yComm} r="4" fill="var(--bg-dark)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx={p.x} cy={p.yConf} r="4" fill="var(--bg-dark)" stroke="var(--success)" strokeWidth="2" />
        </g>
      ))}

      {/* X Axis Labels */}
      {points.map((p, idx) => {
        // Show labels sparingly if list is long
        const showLabel = points.length < 8 || idx % Math.ceil(points.length / 5) === 0 || idx === points.length - 1;
        if (!showLabel) return null;
        return (
          <text 
            key={idx} 
            x={p.x} 
            y={height - 8} 
            fill="var(--text-muted)" 
            fontSize="9" 
            textAnchor="middle"
          >
            {p.dateStr}
          </text>
        );
      })}
    </svg>
  );
}

export default function Dashboard({ setActiveTab, onUnauthorized }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interviews');
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // Sort interviews chronologically
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setInterviews(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate statistics
  const completedSessions = interviews.filter(s => s.status === 'completed');
  const totalCompleted = completedSessions.length;
  
  const avgTech = totalCompleted > 0 
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.technicalScore || 0), 0) / totalCompleted) 
    : 0;

  const avgComm = totalCompleted > 0 
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.communicationScore || 0), 0) / totalCompleted) 
    : 0;

  const avgOverall = totalCompleted > 0 
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / totalCompleted) 
    : 0;

  const currentStreak = totalCompleted; // Simplified streak tracker

  // Extract frequently missed concepts
  const getMissedConcepts = () => {
    const counts = {};
    completedSessions.forEach(s => {
      const topics = s.evaluation?.roadmapTopics || [];
      topics.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const missedConcepts = getMissedConcepts();

  if (selectedReport) {
    return (
      <EvaluationReport 
        report={selectedReport} 
        setActiveTab={setActiveTab} 
        onRestart={() => setSelectedReport(null)} 
      />
    );
  }

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Welcome to PrepAI Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor placement preparedness, practice speech metrics, and track conceptual gaps.</p>
        </div>
        <button onClick={() => setActiveTab('interview')} className="btn btn-primary">
          <Mic size={18} />
          <span>New Mock Interview</span>
        </button>
      </div>

      {loading && interviews.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving dashboard telemetry data...</p>
        </div>
      ) : totalCompleted === 0 ? (
        /* Onboarding View */
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <Award size={48} color="var(--primary)" style={{ opacity: 0.6 }} />
          <h2>Your journey starts here</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: '1.6' }}>
            No interview history recorded. Start your first voice-based mock interview to populate performance analytics, speech telemetry charts, and customized roadmap tasks.
          </p>
          <button onClick={() => setActiveTab('interview')} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Take First Mock Interview
          </button>
        </div>
      ) : (
        /* Active telemetry metrics */
        <>
          {/* Key metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}>
                <Award size={24} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Interviews</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>{totalCompleted}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(14,165,233,0.1)', borderRadius: '10px' }}>
                <BarChart2 size={24} color="var(--secondary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Tech Accuracy</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--secondary)' }}>{avgTech}%</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(167,139,250,0.1)', borderRadius: '10px' }}>
                <MessageSquare size={24} color="var(--accent)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Communication</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent)' }}>{avgComm}%</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                <Flame size={24} color="var(--success)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Overall Rating</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--success)' }}>{avgOverall}%</h3>
              </div>
            </div>
          </div>

          {/* Charts and Missed Concepts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
            {/* Chart Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Telemetry Performance Trends</h2>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--secondary)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }}></span>
                    Technical
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span>
                    Communication
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                    Confidence
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <TrendChart data={completedSessions} />
              </div>
            </div>

            {/* Missed Concepts Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Frequently Missed Concepts</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                PrepAI monitors conceptual gaps in your interview responses and aggregates topics that need study attention.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justify: 'center' }}>
                {missedConcepts.map(({ concept, count }, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                      {concept}
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                      {count} {count > 1 ? 'times' : 'time'}
                    </span>
                  </div>
                ))}
                {missedConcepts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No conceptual gaps detected yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History log card */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Interview History & Progress Timeline
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {completedSessions.slice().reverse().map((session) => (
                <div 
                  key={session.id}
                  onClick={() => setSelectedReport(session.evaluation)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="history-row"
                  title="Click to view full evaluation report"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <Calendar size={18} color="var(--text-muted)" />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{session.role} Interview</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {new Date(session.date).toLocaleDateString()} • {session.type} Round • {session.difficulty}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Overall</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>
                        {session.evaluation?.overallScore || 0}%
                      </div>
                    </div>
                    <ChevronRightIcon />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .history-row:hover {
          background: rgba(99,102,241,0.05) !important;
          border-color: rgba(99,102,241,0.3) !important;
          transform: translateX(4px);
        }
      `}} />
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
