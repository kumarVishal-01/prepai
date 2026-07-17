import React, { useState, useEffect } from 'react';
import { Map, AlertCircle, BookOpen, CheckSquare, Sparkles, HelpCircle, ArrowRight, ChevronRight } from 'lucide-react';

export default function LearningRoadmap({ apiKey, setActiveTab, onUnauthorized }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedTasks, setCheckedTasks] = useState({});

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/roadmap');
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
        
        // Load checked task status from local storage
        const savedChecked = localStorage.getItem('roadmap_checked_tasks');
        if (savedChecked) {
          setCheckedTasks(JSON.parse(savedChecked));
        } else {
          // Initialize from database checklist structure
          const initial = {};
          if (data.prepTasks) {
            data.prepTasks.forEach(task => {
              initial[task.id || task.task] = task.completed || false;
            });
          }
          setCheckedTasks(initial);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to retrieve roadmap.');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId) => {
    const updated = {
      ...checkedTasks,
      [taskId]: !checkedTasks[taskId]
    };
    setCheckedTasks(updated);
    localStorage.setItem('roadmap_checked_tasks', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Analyzing interview trends and mapping learning curves...</p>
      </div>
    );
  }

  // Handle onboarding state (no roadmap generated yet)
  const hasRecommendations = roadmap && roadmap.recommendations && roadmap.recommendations.length > 0;
  
  if (!hasRecommendations) {
    return (
      <div className="slide-up">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Personalized Learning Path</h1>
          <p style={{ color: 'var(--text-muted)' }}>Follow a dynamic roadmap tailored to close your technical gaps.</p>
        </div>

        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <Map size={48} color="var(--primary)" style={{ opacity: 0.6 }} />
          <h3>Roadmap is currently empty</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', lineHeight: '1.5', margin: '0 auto' }}>
            Complete a voice mock interview session first! PrepAI will analyze your performance, identify weaknesses, and build a targeted roadmap to prepare you for hiring rounds.
          </p>
          <button onClick={() => setActiveTab('interview')} className="btn btn-primary" style={{ marginTop: '0.5rem', gap: '0.4rem' }}>
            <span>Start Mock Interview</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const { recommendations = [], prepTasks = [] } = roadmap;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Map size={28} color="var(--primary)" />
          <span>Your Placement Roadmap</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Follow this prioritized learning track to strengthen concepts missed in mock rounds.</p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--error)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Structured Roadmap Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', paddingLeft: '1.5rem' }}>
        
        {/* Timeline connector bar */}
        <div style={{
          position: 'absolute',
          left: '5px',
          top: '20px',
          bottom: '20px',
          width: '2px',
          background: 'linear-gradient(to bottom, var(--primary), var(--secondary), rgba(255,255,255,0.05))',
          zIndex: 0
        }}></div>

        {recommendations.map((rec, index) => {
          const isHigh = rec.priority === 'High';
          const isMed = rec.priority === 'Medium';
          
          return (
            <div key={index} style={{ position: 'relative', zIndex: 1 }}>
              
              {/* Timeline circle node */}
              <div style={{
                position: 'absolute',
                left: '-21px',
                top: '5px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: isHigh ? 'var(--error)' : isMed ? 'var(--warning)' : 'var(--success)',
                border: '3px solid var(--bg-dark)',
                boxShadow: `0 0 10px ${isHigh ? 'var(--error)' : isMed ? 'var(--warning)' : 'var(--success)'}`
              }}></div>

              {/* Node content card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Node Title & Priority badge */}
                <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
                    Step {index + 1}: {rec.topicName}
                  </h3>
                  <span className={`badge ${isHigh ? 'badge-danger' : isMed ? 'badge-primary' : 'badge-success'}`}>
                    {rec.priority} Priority
                  </span>
                </div>

                {/* Concept summary */}
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                  {rec.conceptSummary}
                </p>

                {/* Grid details: Resources and practice tasks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  
                  {/* Recommended study and questions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                        <BookOpen size={14} />
                        <span>Recommended Reference Materials</span>
                      </h4>
                      <ul style={{ paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {rec.studyResources && rec.studyResources.map((res, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{res}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                        <Sparkles size={14} />
                        <span>Core Practice Questions</span>
                      </h4>
                      <ul style={{ paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {rec.practiceQuestions && rec.practiceQuestions.map((q, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{q}"</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Node Checklist */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontWeight: 600 }}>
                      <CheckSquare size={14} />
                      <span>Node Milestones</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {rec.preTasks && rec.preTasks.map((task, idx) => {
                        const taskId = `${rec.topicName}-${idx}`;
                        const isDone = !!checkedTasks[taskId];
                        
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(0,0,0,0.15)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleTask(taskId)}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              readOnly
                              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <span style={{ 
                              fontSize: '0.82rem', 
                              color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Global Prep checklist milestones */}
      {prepTasks.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={20} color="var(--primary)" />
            <span>Comprehensive Prep Action Items</span>
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {prepTasks.map((taskItem, idx) => {
              const taskId = taskItem.id || `global-${idx}`;
              const isCompleted = !!checkedTasks[taskId];
              
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleTask(taskId)}
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    readOnly
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '0.9rem',
                    color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {taskItem.task}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
