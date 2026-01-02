import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterWorker.css';

const API_BASE = 'https://shramjivi-backend-h7ek.onrender.com';

export default function RegisterWorker() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    designation: '', name: '', fhName: '', dob: '', sex: '', bloodGroup: '', category: '', 
    maritalStatus: 'Un-Married', mobileNo: '', email: '', communicationAddress: '', 
    address: '', education: '', aadhaarNo: '', panNo: '', eshramNo: '', accName: '', 
    accNo: '', ifsc: '', bankName: '', zone: '', membershipDate: '', division: '', shed: '',
    photo: null, photoPreview: '', consent: false
  });

  const steps = [
    { id: 1, label: 'Personal', icon: '👤' },
    { id: 2, label: 'Contact', icon: '📞' },
    { id: 3, label: 'Verification', icon: '🆔' },
    { id: 4, label: 'Photo', icon: '📸' },
    { id: 5, label: 'Review', icon: '📝' }
  ];

  useEffect(() => {
    if (!storedUser?.id) { navigate('/login'); return; }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profile/${storedUser.id}`);
        setProfile(res.data || {});
      } catch (err) { console.error("Profile fetch error", err); }
    };
    fetchProfile();
  }, [storedUser.id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormatChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'mobileNo') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    } 
    else if (name === 'aadhaarNo' || name === 'eshramNo') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 12);
      const matches = numbersOnly.match(/(\d{0,4})(\d{0,4})(\d{0,4})/);
      formattedValue = !matches[2] ? matches[1] : `${matches[1]}-${matches[2]}${matches[3] ? `-${matches[3]}` : ''}`;
    } 
    else if (name === 'panNo') {
      formattedValue = value.toUpperCase().slice(0, 10);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleFile = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, photoPreview: reader.result, photo: file }));
    reader.readAsDataURL(file);
  };

  const handleSkipPhoto = () => {
    setForm(prev => ({ ...prev, photo: null, photoPreview: '' }));
    setStep(5); // Skip to review step
  };

  const handleDownloadForm = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      alert("Please enter a valid email format (e.g., xyz@zyz.com)");
      return;
    }

    if (!form.consent) { alert("Please confirm the declaration."); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (!['photoPreview', 'consent', 'photo'].includes(key)) {
          formData.append(key, form[key] || 'N/A');
        }
      });
      if (form.photo) formData.append('photo', form.photo);
      formData.append('adminId', storedUser.id);

      const res = await axios.post(`${API_BASE}/api/workers/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Registration_SGWC_${form.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert("✅ Form Generated with Unique Form No!");
      navigate('/dashboard');
    } catch (err) { 
        alert("Generation error. Check server."); 
    } finally { setLoading(false); }
  };

  return (
    <div className="rw-viewport">
      <nav className="ms-top-nav">
        <div className="ms-logo-section">
          <div className="ms-square-logo-container">
            <img src="/logo.png" alt="Logo" className="ms-nav-logo" />
          </div>
          <span className="ms-vertical-divider">|</span>
          <span className="ms-app-title">Shramjivi Admin Center</span>
        </div>
        <div className="ms-header-right">
          <button className="ms-nav-dashboard-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </nav>

      <div className="rw-container">
        <div className="rw-progress-track">
          {steps.map((s) => (
            <div key={s.id} className={`rw-track-item ${step >= s.id ? 'active' : ''}`}>
              <div className="rw-track-icon">{s.icon}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="rw-glass-card">
          <main className="rw-form-body">
            {step === 1 && (
              <div className="rw-pane">
                <h3 className="rw-section-title">👤 Personal Details</h3>
                <div className="rw-grid">
                  <div className="rw-field"><label>ZONE</label><input name="zone" value={form.zone} onChange={handleChange} required /></div>
                  <div className="rw-field"><label>Designation</label><input name="designation" value={form.designation} onChange={handleChange} /></div>
                  <div className="rw-field"><label>Full Name</label><input name="name" value={form.name} onChange={handleChange} /></div>
                  {/* ✅ UPDATED: Father's name/ Husband's Name */}
                  <div className="rw-field"><label>Father's name/ Husband's Name</label><input name="fhName" value={form.fhName} onChange={handleChange} /></div>
                  <div className="rw-field"><label>D.O.B</label><input type="date" name="dob" value={form.dob} onChange={handleChange} /></div>
                  <div className="rw-field"><label>Sex</label><select name="sex" value={form.sex} onChange={handleChange}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div className="rw-field"><label>Blood Group</label><input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} /></div>
                  <div className="rw-field"><label>Category</label><input name="category" value={form.category} onChange={handleChange} /></div>
                  {/* ✅ NEW: Marital Status Dropdown */}
                  <div className="rw-field"><label>Marital Status</label>
                    <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                      <option value="Un-Married">Un-Married</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Single">Single</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rw-pane">
                <h3 className="rw-section-title">📞 Contact & Education</h3>
                <div className="rw-grid">
                  <div className="rw-field"><label>Mobile No</label><input type="text" name="mobileNo" value={form.mobileNo} onChange={handleFormatChange} /></div>
                  <div className="rw-field"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="xyz@zyz.com" /></div>
                  <div className="rw-field rw-full"><label>Communication Address</label><textarea name="communicationAddress" value={form.communicationAddress} onChange={handleChange} rows="2" /></div>
                  <div className="rw-field rw-full"><label>Permanent Address</label><textarea name="address" value={form.address} onChange={handleChange} rows="2" /></div>
                  <div className="rw-field rw-full"><label>Qualification</label><textarea name="education" value={form.education} onChange={handleChange} rows="2" /></div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rw-pane">
                <h3 className="rw-section-title">🆔 Verification & Bank</h3>
                <div className="rw-grid">
                  <div className="rw-field"><label>Aadhaar No</label><input type="text" name="aadhaarNo" value={form.aadhaarNo} onChange={handleFormatChange} placeholder="0000-0000-0000" /></div>
                  <div className="rw-field"><label>PAN No</label><input type="text" name="panNo" value={form.panNo} onChange={handleFormatChange} placeholder="ABCDE1234F" /></div>
                  <div className="rw-field"><label>E-Shram No</label><input type="text" name="eshramNo" value={form.eshramNo} onChange={handleFormatChange} placeholder="0000-0000-0000" /></div>
                  {/* ✅ UPDATED: A/c Holder Name */}
                  <div className="rw-field"><label>A/c Holder Name</label><input name="accName" value={form.accName} onChange={handleChange} /></div>
                  <div className="rw-field"><label>A/C Number</label><input name="accNo" value={form.accNo} onChange={handleChange} /></div>
                  <div className="rw-field"><label>IFSC Code</label><input name="ifsc" value={form.ifsc} onChange={handleChange} /></div>
                  <div className="rw-field rw-full"><label>Bank Name</label><input name="bankName" value={form.bankName} onChange={handleChange} /></div>
                </div>
              </div>
            )}

            {step === 4 && (
  <div className="rw-pane text-center">
    <h3 className="rw-section-title">📸 Photo Capture</h3>
    <div className="rw-photo-frame">
        {form.photoPreview ? <img src={form.photoPreview} alt="Preview" className="rw-photo-preview" /> : <span>Passport Photo</span>}
    </div>
    {/* ✅ SMALLER BUTTONS */}
    <div className="rw-photo-buttons">
      <input type="file" id="p-photo" hidden accept="image/*" onChange={(e) => handleFile(e, 'photo')} />
      <label htmlFor="p-photo" className="rw-upload-btn">Select Photo</label>
      <button type="button" className="rw-skip-btn" onClick={handleSkipPhoto}>Skip Photo</button>
    </div>
  </div>
)}



            {step === 5 && (
              <div className="rw-pane">
                <div className="rw-review-header">
                  <h3 className="rw-section-title">📝 Final Application Review</h3>
                  <div className="rw-form-no-badge">
                    <strong>FORM NO:</strong> Assigned Sequentially Upon Download
                  </div>
                </div>

                <div className="rw-review-scroll-area">
                  <div className="rw-review-section-header">👤 Personal Profile</div>
                  <div className="rw-review-grid">
                    <div className="rw-review-tile"><label>Full Name</label><span>{form.name || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Designation</label><span>{form.designation || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Father's name/ Husband's Name</label><span>{form.fhName || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Date of Birth</label><span>{form.dob || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Sex</label><span>{form.sex || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Marital Status</label><span>{form.maritalStatus || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Blood Group</label><span>{form.bloodGroup || 'N/A'}</span></div>
                  </div>

                  <div className="rw-review-section-header">🏦 Identity & Banking Assets</div>
                  <div className="rw-review-grid">
                    <div className="rw-review-tile"><label>Aadhaar Number</label><span>{form.aadhaarNo || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>PAN Card No</label><span>{form.panNo || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>E-Shram No</label><span>{form.eshramNo || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>A/c Holder Name</label><span>{form.accName || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Account Number</label><span>{form.accNo || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>IFSC Code</label><span>{form.ifsc || 'N/A'}</span></div>
                    <div className="rw-review-tile"><label>Zone</label><span>{form.zone || 'N/A'}</span></div>
                  </div>

                  <div className="rw-review-declaration-box">
                    <div className="legal-checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        id="cons" 
                        checked={form.consent} 
                        onChange={handleChange} 
                        name="consent" 
                        className="modern-checkbox"
                      />
                      <label htmlFor="cons" className="legal-label">
                        I, <strong>{form.name || '[Applicant Name]'}</strong>, hereby declare that all information given above is true and correct to the best of my knowledge and belief...
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          <footer className="rw-actions">
            {step > 1 && <button className="rw-btn-back" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 5 ? (
              <button className="rw-btn-next" onClick={() => setStep(step + 1)}>Continue →</button>
            ) : (
              <button className="rw-btn-submit" disabled={!form.consent || loading} onClick={handleDownloadForm}>
                {loading ? 'Generating Form No...' : 'Download Form'}
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
