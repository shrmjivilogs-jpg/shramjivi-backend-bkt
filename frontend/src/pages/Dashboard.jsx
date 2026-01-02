import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_BASE = 'https://shramjivi-backend-h7ek.onrender.com';

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profile, setProfile] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      const [profileRes, workersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/profile/${storedUser.id}`),
        axios.get(`${API_BASE}/api/workers`),
      ]);
      setProfile(profileRes.data || {});
      setWorkers(workersRes.data || []);
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storedUser?.id) {
      navigate('/login');
      return;
    }
    loadData();
  }, [storedUser.id, navigate]);

  // ✅ 1. Filter Logic: Sirf wahi data jo current Admin ne bhara hai
  const myWorkers = workers.filter(w => w.adminId === storedUser.id);

  // 2. Search + Status Filtering on My Workers
  const filteredWorkers = myWorkers.filter((w) => {
    const matchesSearch = w.formNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPDF = async (worker) => {
    try {
      window.open(`${API_BASE}/api/workers/${worker._id}/pdf`, '_blank');
    } catch (err) {
      alert("Download failed.");
    }
  };

  const handleDownloadReceipt = (workerId) => {
    window.open(`${API_BASE}/api/workers/${workerId}/receipt`, '_blank');
  };

  const handleDriveLinkSubmit = async (workerId, formNo) => {
    const driveLink = prompt(`Enter Google Drive Link for Form No: ${formNo}`);
    
    if (!driveLink || driveLink.trim() === "") return;

    try {
      const res = await axios.post(`${API_BASE}/api/workers/${workerId}/upload-scan`, {
        driveLink: driveLink 
      });

      if (res.data.success) {
        alert(`✅ Drive link saved successfully for Form: ${formNo}`);
      } else {
        alert(`❌ Failed: ${res.data.message || 'Unknown error'}`);
      }
      await loadData();
    } catch (err) {
      console.error("Submission error:", err);
      alert(`❌ Submission failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return <div className="ms-loader">Initializing Dashboard...</div>;
  }

  return (
    <div className="ms-viewport">
      <nav className="ms-top-nav">
        <div className="ms-logo-section">
          <div className="ms-square-logo-container">
            <img src="/logo.png" alt="Shramjivi Logo" className="ms-nav-logo" />
          </div>
          <span className="ms-vertical-divider">|</span>
          <span className="ms-app-title">Shramjivi Admin Center</span>
        </div>
        <div className="ms-header-right">
          <button className="ms-nav-dashboard-btn" onClick={() => navigate('/register-worker')}>
            + New Registration
          </button>
          <button
            className="ms-logout-btn"
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="ms-dashboard-body">
        <aside className="ms-action-sidebar">
          <div className="ms-sidebar-group">
            <h3>Primary Operations</h3>
            <button className="ms-sidebar-btn primary" onClick={() => navigate('/register-worker')}>
              Register New Worker
            </button>
          </div>

          <div className="ms-sidebar-group admin-info-box">
            <h3>Admin Profile</h3>
            <div className="ms-mini-stat"><label>Administrator Name</label><p>{profile?.firstName} {profile?.lastName}</p></div>
            <div className="ms-mini-stat"><label>Admin ID</label><p>{profile?.id || storedUser.id}</p></div>
            <div className="ms-mini-stat"><label>Assigned Zone</label><p>{profile?.zone || 'NFR'}</p></div>
          </div>

          <div className="ms-sidebar-group">
            <div className="ms-sidebar-logo">
              <img src="/logo.png" alt="Shramjivi Logo" className="sidebar-logo-image" />
              <p className="ms-tagline">Serving Shramjivi Since 2025</p>
            </div>
          </div>
        </aside>

        <main className="ms-workspace">
          <div className="ms-stats-grid">
            <div className="ms-stat-card">
              <label>Total Forms</label>
              {/* ✅ 3. Updated Count Display (0/500) */}
              <div className="ms-stat-value">{myWorkers.length} / 500</div>
              <p>Personal Registration Limit</p>
            </div>
            <div className="ms-stat-card">
              <label>Recent Submissions</label>
              <div className="ms-stat-value">
                {myWorkers.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).length}
              </div>
              <p>Forms filled by you today</p>
            </div>
            <div className="ms-stat-card">
              <label>System Status</label>
              <div className="ms-stat-value green">Active</div>
              <p>Node Server is responding</p>
            </div>
          </div>

          <section className="ms-section-box no-padding">
            <div className="ms-table-toolbar">
              <h2>My Generated Forms</h2>
              <div className="ms-toolbar-filters">
                <input
                  type="text"
                  placeholder="Search Form No or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="ms-table-container">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>Form Number</th>
                    <th>Worker Name</th>
                    <th>Zone</th>
                    <th>Date / Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="ms-empty">No worker records found.</td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w) => (
                      <tr key={w._id}>
                        <td><span className="ms-form-tag">{w.formNo}</span></td>
                        <td><strong>{w.name}</strong></td>
                        <td>{w.zone || 'N/A'}</td>
                        <td>{new Date(w.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`ms-status-pill ${w.status === 'Verified' ? 'verified' : 'pending'}`}>
                            {w.status === 'Verified' ? 'Verified' : 'Form Not Verified'}
                          </span>
                        </td>
                        <td className="ms-table-actions">
                          <button className="ms-action-icon-btn" title="Download PDF" onClick={() => handleDownloadPDF(w)}>📥 Download</button>
                          <button className="ms-action-icon-btn" title="Submit Drive Link" onClick={() => handleDriveLinkSubmit(w._id, w.formNo)}>🔗 Drive Link</button>
                          {w.scanLink && (
                            <a href={w.scanLink} target="_blank" rel="noopener noreferrer" className="ms-action-icon-btn" title="View Uploaded Scan" style={{ color: '#1a73e8', marginLeft: '8px' }}>📄 View Scan</a>
                          )}
                          <button
                            className="ms-action-icon-btn receipt-btn"
                            title="Download Receipt"
                            onClick={() => handleDownloadReceipt(w._id)}
                            disabled={w.status !== 'Verified'}
                            style={{
                              opacity: w.status === 'Verified' ? 1 : 0.3,
                              cursor: w.status === 'Verified' ? 'pointer' : 'not-allowed',
                            }}
                          >🧾 Receipt</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}