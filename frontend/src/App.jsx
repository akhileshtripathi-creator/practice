import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' or 'upload'
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const formData = new FormData();
      if (activeTab === 'paste') {
        if (!resumeText.trim()) {
          setError('Please enter your resume text.');
          setLoading(false);
          return;
        }
        formData.append('resumeText', resumeText);
      } else {
        if (!resumeFile) {
          setError('Please select a resume file.');
          setLoading(false);
          return;
        }
        formData.append('resume', resumeFile);
      }

      const response = await axios.post('https://practice-777k.onrender.com/api/analyze', formData, {
        headers: { 'Content-Type': activeTab === 'paste' ? 'application/json' : 'multipart/form-data' },
      });

      setAnalysis(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Resume Analyzer</h1>
        <p>Optimize your resume with instant AI-powered feedback, score, and tailored suggestions.</p>
      </header>

      <main className="main-content">
        <div className="input-card">
          <div className="tabs">
            <button 
              className={activeTab === 'paste' ? 'tab active' : 'tab'} 
              onClick={() => setActiveTab('paste')}
            >
              Paste Text
            </button>
            <button 
              className={activeTab === 'upload' ? 'tab active' : 'tab'} 
              onClick={() => setActiveTab('upload')}
            >
              Upload File
            </button>
          </div>

          <form onSubmit={handleAnalyze}>
            {activeTab === 'paste' ? (
              <div className="form-group">
                <textarea
                  rows="10"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group file-drop">
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
                <p>{resumeFile ? `Selected: ${resumeFile.name}` : 'Upload text or document files (.txt, .pdf)'}</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
            </button>
          </form>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Gemini is reviewing your experience, skills, and formatting...</p>
          </div>
        )}

        {analysis && (
          <div className="results-container">
            {/* Score Card */}
            <div className="score-card">
              <h2>Overall Score</h2>
              <div className="score-circle">
                <span>{analysis.score}</span>
                <span className="score-max">/100</span>
              </div>
            </div>

            <div className="grid-results">
              {/* Skills Identified */}
              <div className="result-card">
                <h3>Identified Skills</h3>
                <div className="badge-container">
                  {analysis.skills.map((skill, index) => (
                    <span key={index} className="badge skill-badge">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Key Strengths */}
              <div className="result-card">
                <h3>Strengths</h3>
                <ul>
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills */}
              <div className="result-card">
                <h3>Missing Skills / Keywords</h3>
                <div className="badge-container">
                  {analysis.missingSkills.map((skill, index) => (
                    <span key={index} className="badge missing-badge">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="result-card full-width">
                <h3>Actionable Suggestions</h3>
                <ul className="suggestions-list">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <span className="bullet-icon">💡</span> {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
