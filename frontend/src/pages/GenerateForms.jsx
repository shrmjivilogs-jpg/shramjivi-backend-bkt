import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GenerateForms.css';

const API_BASE = 'http://https://shramjivi-backend-h7ek.onrender.com';

export default function GenerateForms() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(null);
  
  const [count, setCount] = useState(1); // Default to 1 for individual PDF
  const [zoneCode, setZoneCode] = useState('N');
  const [zoneTitle, setZoneTitle] = useState('North');
  const [consent, setConsent] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Dynamic Button State Logic
  const isZipMode = Number(count) >= 4;

  const zones = [
    { code: 'N', title: 'North' },
    { code: 'S', title: 'South' },
    { code: 'E', title: 'East' },
    { code: 'W', title: 'West' },
    { code: 'GEN', title: 'General' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profile/${storedUser.id}`);
        setProfile(res.data || {});
      } catch (_) {}
    };
    fetchProfile();
  }, [storedUser.id]);

  const handleZoneChange = (e) => {
    const code = e.target.value;
    const z = zones.find((zone) => zone.code === code);
    setZoneCode(code);
    setZoneTitle(z ? z.title : 'General');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) return alert('Please accept the consent statement.');
    
    setGenerating(true);
    try {
      // Determine filename based on mode
      const fileExt = isZipMode ? 'zip' : 'pdf';
      const downloadName = `Registration_${zoneTitle}_${Date.now()}.${fileExt}`;

      const res = await axios.post(`${API_BASE}/api/generate-forms-batch`,
        { 
          userId: storedUser.id, 
          count: Number(count), 
          zoneCode, 
          zoneTitle,
          templateType: 'OFFLINE_CONSENT_v2',
          outputFormat: fileExt // Tell backend which format to package
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      alert(`Forms successfully generated as ${fileExt.toUpperCase()}.`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to generate forms batch.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="ms-viewport">
      {/* Top Nav code remains the same as your previous version */}
      <nav className="ms-top-nav">
        <div className="ms-logo-section">
          <div className="ms-square-logo">SJ</div>
          <span className="ms-vertical-divider">|</span>
          <span className="ms-app-title">Admin Center</span>
        </div>
        <div className="ms-header-right">
          <div className="ms-user-info">
            <div className="ms-user-text">
              <span className="ms-name">{profile?.firstName} {profile?.lastName}</span>
              <span className="ms-role">Administrator</span>
            </div>
            <img src={profile?.photoUrl || 'https://via.placeholder.com/32'} alt="Profile" />
          </div>
        </div>
      </nav>

      <div className="ms-main-container">
        <aside className="ms-sidebar">
          <h1 className="ms-sidebar-title">Batch Operations</h1>
          <div className="ms-step-indicator">
            <div className={`ms-step-item ${!isZipMode ? 'active' : ''}`}>Individual PDF Mode</div>
            <div className={`ms-step-item ${isZipMode ? 'active' : ''}`}>Batch ZIP Mode</div>
          </div>
          <div className="ms-system-info">
             <label>Current Mode: {isZipMode ? 'ZIP Bundle' : 'PDF Document'}</label>
             <label>Zone: {zoneTitle}</label>
          </div>
        </aside>

        <main className="ms-content-area">
          <div className="gen-container">
            <div className="gen-card">
              <header className="gen-header">
                <h1>Generate Registration Forms</h1>
                <p>
                  System dynamically switches between single PDF and ZIP archive based on quantity. 
                  [cite: 1-48]
                </p>
              </header>

              <form onSubmit={handleSubmit} className="gen-form">
                <div className="gen-field">
                  <label>Number of Forms (Max 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>

                <div className="gen-field">
                  <label>Assign to Zone</label>
                  <select value={zoneCode} onChange={handleZoneChange}>
                    {zones.map((z) => (
                      <option key={z.code} value={z.code}>{z.title}</option>
                    ))}
                  </select>
                </div>

                <div className="gen-consent">
                  <input
                    type="checkbox"
                    id="gen-cons"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <label htmlFor="gen-cons">
                    I confirm these forms will include the 5-point declaration and consent clauses. [cite: 27-37]
                  </label>
                </div>

                <div className="gen-actions">
                   <button type="button" className="ms-btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
                   
                   {/* DYNAMIC BUTTON TEXT */}
                   <button type="submit" className="ms-btn-primary gen-submit" disabled={generating || !consent}>
                      {generating 
                        ? 'Building File...' 
                        : isZipMode 
                          ? `Generate Forms (ZIP)` 
                          : `Generate Forms (PDF)`
                      }
                   </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}