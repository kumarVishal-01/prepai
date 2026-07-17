import React, { useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, TrendingUp, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

function CircularProgress({ percent, size = 120, strokeWidth = 10, color = 'var(--primary)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          stroke="rgba(255, 255, 255, 0.04)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="progress-ring-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{Math.round(percent)}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Score</span>
      </div>
    </div>
  );
}

export default function EvaluationReport({ report, setActiveTab, onRestart }) {
  // Trigger success confetti on mounting the final evaluation report!
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#0ea5e9', '#10b981', '#a78bfa']
    });
  }, []);

  if (!report) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertTriangle size={36} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h3>No report details found</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Failed to retrieve the interview assessment report.</p>
        <button onClick={onRestart} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Back to Lobby
        </button>
      </div>
    );
  }

  const {
    overallScore = 0,
    technicalScore = 0,
    communicationScore = 0,
    confidenceScore = 0,
    stats = {},
    technicalEvaluation = {},
    communicationEvaluation = {},
    strengths = [],
    weaknesses = [],
    questionsFeedback = []
  } = report;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={32} color="var(--primary)" />
            <span>Interview Report Card</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Detailed scorecard evaluating technical knowledge, speech delivery, and roadmap recommendations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onRestart} className="btn btn-secondary">
            Restart Interview
          </button>
          <button onClick={() => setActiveTab('roadmap')} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <span>View Study Roadmap</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Progress gauges */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <CircularProgress percent={overallScore} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Overall Performance</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weighted score</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <CircularProgress percent={technicalScore} color="var(--secondary)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Technical Accuracy</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Depth & conceptual truth</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <CircularProgress percent={communicationScore} color="var(--accent)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Communication</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fluency, pace & pauses</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <CircularProgress percent={confidenceScore} color="var(--success)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Confidence Index</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery & assertion</p>
          </div>
        </div>
      </div>

      {/* Speech telemetry stats card */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', padding: '1.25rem' }}>
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Average Pace
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {stats.averageSpeakingPaceWPM || 135} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>WPM</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Normal conversational speech is typically 120-150 WPM.
          </div>
        </div>

        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Filler Words Detected
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (stats.fillerWordsCount || 0) > 8 ? 'var(--warning)' : '#fff' }}>
            {stats.fillerWordsCount || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>occurrences</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            List: {stats.fillerWordsList && stats.fillerWordsList.length > 0 ? stats.fillerWordsList.join(', ') : 'None detected!'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Hesitant Pauses
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (stats.longPausesDetectedCount || 0) > 3 ? 'var(--warning)' : '#fff' }}>
            {stats.longPausesDetectedCount || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>long gaps</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Pauses greater than 2.5 seconds during response streaming.
          </div>
        </div>
      </div>

      {/* Double column detailed scores and strengths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Dimensions details */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <span>Scorecard Breakdown</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Technical Accuracy</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{technicalEvaluation.accuracy || 'Adequate response accuracy.'}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Conceptual Understanding</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{technicalEvaluation.conceptualUnderstanding || 'Demonstrated grasp of basic parameters.'}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Depth of Knowledge</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{technicalEvaluation.depthOfKnowledge || 'Technical definitions details coverage.'}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.25rem' }}>Fluency & Coherence</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{communicationEvaluation.fluency || 'Clear pronunciation and speech stream.'}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.25rem' }}>Grammar & Vocabulary</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{communicationEvaluation.grammar || 'Correct syntax and proper technical vocab.'}</p>
            </div>
          </div>
        </div>

        {/* Strengths and weaknesses lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Strengths */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--success)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Key Strengths
            </h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {strengths.map((str, idx) => (
                <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{str}</li>
              ))}
              {strengths.length === 0 && <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No strengths noted.</li>}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--error)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Development Areas
            </h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {weaknesses.map((weak, idx) => (
                <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{weak}</li>
              ))}
              {weaknesses.length === 0 && <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No development areas noted.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Question by question feedback breakdown */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} color="var(--primary)" />
          <span>Question-by-Question Response Review</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questionsFeedback.map((item, idx) => (
            <div key={idx} style={{ borderBottom: idx < questionsFeedback.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '1.5rem' }}>
              
              {/* Question header */}
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)' }}>Q{item.questionNumber || idx + 1}.</span>
                  <span>{item.question}</span>
                </h4>
                {item.isGood ? (
                  <span className="badge badge-success" style={{ flexShrink: 0 }}>Approved</span>
                ) : (
                  <span className="badge badge-danger" style={{ flexShrink: 0 }}>Needs Review</span>
                )}
              </div>

              {/* Response transcript */}
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                  YOUR RECORDED ANSWER TRANSCRIPT:
                </span>
                <p style={{ fontStyle: item.answer ? 'normal' : 'italic', color: item.answer ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {item.answer || '[No voice transcript captured]'}
                </p>
              </div>

              {/* Feedback text */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>AI ANALYSIS:</span>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.feedback}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>SUGGESTED ACTIONS:</span>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.suggestions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
