import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Database, BookOpen, Terminal, CheckCircle2 } from 'lucide-react';
import Header from './components/Header';
import TechStackBar from './components/TechStackBar';
import GeminiPlayground from './components/GeminiPlayground';
import TeamRoster from './components/TeamRoster';
import DataExplorer from './components/DataExplorer';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('gemini');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth().then(setHealth);
    const interval = setInterval(() => {
      fetchHealth().then(setHealth);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Navbar with Live Badges */}
      <Header health={health} />

      {/* Hero Header */}
      <section className="hero">
        <div className="hero-pill">
          <span>🚀 Ready for Hackathon Launch</span>
        </div>
        <h2>
          Build Faster with <span className="gradient-text">Gemini & Full-Stack Speed</span>
        </h2>
        <p>
          Instant development scaffolding equipped with React, FastAPI async endpoints, Neon Serverless PostgreSQL, Google Gemini AI integration, and uv package management.
        </p>
      </section>

      {/* Tech Stack Chip Bar */}
      <TechStackBar />

      {/* Navigation Tabs */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
          onClick={() => setActiveTab('gemini')}
        >
          <Sparkles size={16} />
          <span>Gemini Playground</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={16} />
          <span>Team & Workstreams</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={16} />
          <span>Data & Storage</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          <BookOpen size={16} />
          <span>Stack Runbook</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <main>
        {activeTab === 'gemini' && <GeminiPlayground />}
        {activeTab === 'team' && <TeamRoster />}
        {activeTab === 'database' && <DataExplorer />}
        {activeTab === 'setup' && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Terminal size={18} color="#6366f1" />
                  <span>Developer Quickstart & Runbook</span>
                </div>
                <p className="card-subtitle">Commands to boot backend, frontend, and connect credentials</p>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div style={{ background: 'rgba(10, 14, 23, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: '#c7d2fe', marginBottom: '8px' }}>1. Backend (FastAPI + uv)</h4>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8', overflowX: 'auto', background: '#05070a', padding: '12px', borderRadius: '6px' }}>
cd backend&#10;uv run uvicorn app.main:app --reload --port 8000
                </pre>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Interactive Swagger docs available at: <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>http://localhost:8000/docs</a>
                </p>
              </div>

              <div style={{ background: 'rgba(10, 14, 23, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: '#c7d2fe', marginBottom: '8px' }}>2. Frontend (React + Vite)</h4>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8', overflowX: 'auto', background: '#05070a', padding: '12px', borderRadius: '6px' }}>
cd frontend&#10;npm run dev
                </pre>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Vite client available at: <a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>http://localhost:5173</a>
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <h4 style={{ color: '#e0e7ff', fontSize: '0.9rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Environment Configuration (.env)</span>
              </h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                To connect live services, edit <code style={{ color: '#c7d2fe' }}>backend/.env</code> and provide your <strong>GEMINI_API_KEY</strong> from Google AI Studio and <strong>DATABASE_URL</strong> from your Neon console. The starter works seamlessly in standby/mock mode without them!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Hackathon Starter Template • Built with React, FastAPI, Neon, Google Gemini, and uv</p>
      </footer>
    </div>
  );
}
