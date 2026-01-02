import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Setup.css';

const API_BASE = 'http://https://shramjivi-backend-h7ek.onrender.com';

export default function Setup() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', emailVerified: false,
    phone: '', username: '', password: '', confirmPassword: '',
    address: '', pincode: '', city: '', state: '', country: 'India',
    lat: '', lng: '', ipAddress: '', photoPreview: '',
    adhaarNumber: '', panNumber: '', adhaarFile: null, panFile: null, photoFile: null,
    otp: '', otpStatus: '', consent: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ipRes = await axios.get('https://api.ipify.org?format=json');
        let profileData = {};
        if (storedUser?.id) {
          const profRes = await axios.get(`${API_BASE}/api/profile/${storedUser.id}`);
          profileData = profRes.data || {};
        }

        setForm(prev => ({ 
            ...prev, ...profileData, 
            ipAddress: ipRes.data.ip, 
            photoPreview: profileData.photoUrl || prev.photoPreview
        }));
      } catch (_) { console.log("Init fetch failed"); }
      setLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setForm(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }));
      }, null, { enableHighAccuracy: true });
    }
    fetchData();
  }, [storedUser.id]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (field === 'photoFile') {
        const reader = new FileReader();
        reader.onloadend = () => setForm(prev => ({ ...prev, photoPreview: reader.result, photoFile: file }));
        reader.readAsDataURL(file);
    } else {
        if (file) setForm(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSendOtp = async () => {
    if (!form.email) return;
    setSendingOtp(true);
    try {
      await axios.post(`${API_BASE}/api/send-email-otp`, { email: form.email });
      setForm(prev => ({ ...prev, otpStatus: 'OTP sent to email' }));
    } catch (err) { setForm(prev => ({ ...prev, otpStatus: 'Failed to send OTP' })); }
    finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp) return;
    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/api/verify-email-otp`, { otp: form.otp, email: form.email });
      if (res.data.success) setForm(prev => ({ ...prev, emailVerified: true, otpStatus: 'Email Verified!' }));
    } catch (err) { setForm(prev => ({ ...prev, otpStatus: 'Invalid OTP' })); }
    finally { setVerifyingOtp(false); }
  };

  const handleSubmit = async () => {
    if (!form.emailVerified) { alert("Please verify your email first."); return; }
    if (form.password !== form.confirmPassword) { alert("Passwords do not match."); return; }
    setSaving(true);
    
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (!['adhaarFile', 'panFile', 'photoFile', 'photoPreview', 'confirmPassword'].includes(key)) {
          formData.append(key, form[key]);
        }
      });
      if (form.adhaarFile) formData.append('adhaarFile', form.adhaarFile);
      if (form.panFile) formData.append('panFile', form.panFile);
      if (form.photoFile) formData.append('photoFile', form.photoFile);

      // Sent to superadmin for approval
      await axios.post(`${API_BASE}/api/register-admin`, formData);
      alert("Registration submitted. You can login once the Superadmin approves your account.");
      navigate('/login'); 
    } catch (err) { alert('Submission failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="ms-loader">Initializing Environment...</div>;

  return (
    <div className="ms-viewport">
      <nav className="ms-top-nav">
        <div className="ms-logo-section">
          <div className="ms-square-logo">SJ</div>
          <span className="ms-vertical-divider">|</span>
          <span className="ms-app-title">Admin Onboarding Center</span>
        </div>
      </nav>

      <div className="ms-main-container">
        <aside className="ms-sidebar">
          <h1 className="ms-sidebar-title">Create Admin Profile</h1>
          <div className="ms-step-indicator">
            <div className={`ms-step-item ${step === 1 ? 'active' : ''}`}>1. Account Details</div>
            <div className={`ms-step-item ${step === 2 ? 'active' : ''}`}>2. Permissions</div>
            <div className={`ms-step-item ${step === 3 ? 'active' : ''}`}>3. Review</div>
          </div>
          <div className="ms-system-info">
            <div className="ms-meta-tag">SECURITY AUDIT</div>
            <label>IP: {form.ipAddress}</label>
            <label>LOC: {form.lat}, {form.lng}</label>
          </div>
        </aside>

        <main className="ms-content-area">
          <div className="ms-step-container">
            {step === 1 && (
              <div className="ms-step-pane">
                <h2 className="ms-pane-title">Account Details</h2>
                <div className="ms-profile-section">
                    <div className="ms-avatar-circle">
                        <img src={form.photoPreview || 'https://via.placeholder.com/150'} alt="Avatar" />
                        <label className="ms-avatar-edit">
                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'photoFile')} />
                            Edit Picture
                        </label>
                    </div>
                </div>
                <div className="ms-input-grid">
                  <div className="ms-field"><label>First Name</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                  <div className="ms-field"><label>Last Name</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
                  <div className="ms-field"><label>Mobile Number</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div className="ms-field">
                    <label>Email Verification</label>
                    <div className="ms-verify-row">
                        <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={form.emailVerified} />
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp || form.emailVerified} className="ms-btn-small">Get OTP</button>
                    </div>
                    {!form.emailVerified && (
                        <div className="ms-otp-row">
                            <input placeholder="Enter OTP" value={form.otp} onChange={e => setForm({...form, otp: e.target.value})} />
                            <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp}>Verify</button>
                        </div>
                    )}
                  </div>
                  <div className="ms-field"><label>Create Username</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
                  <div className="ms-field"><label>Create Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                  <div className="ms-field ms-full"><label>Confirm Password</label><input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="ms-step-pane">
                <h2 className="ms-pane-title">Permissions & Verification</h2>
                <div className="ms-input-grid">
                  <div className="ms-field"><label>Aadhaar No</label><input placeholder="XXXX XXXX XXXX" value={form.adhaarNumber} onChange={e => setForm({...form, adhaarNumber: e.target.value})} /></div>
                  <div className="ms-field"><label>PAN No</label><input placeholder="ABCDE1234F" value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value})} /></div>
                  <div className="ms-field"><label>Aadhaar Card Scan</label><input type="file" onChange={e => handleFileChange(e, 'adhaarFile')} /></div>
                  <div className="ms-field"><label>PAN Card Scan</label><input type="file" onChange={e => handleFileChange(e, 'panFile')} /></div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
{step === 3 && (
  <div className="ms-step-pane ms-review-pane">
    <h2 className="ms-pane-title">Final Review & Authorization</h2>
    <p className="ms-pane-sub">Please verify your credentials and security data before final submission.</p>
    
    <div className="ms-review-container">
      <div className="ms-review-header">
        <div className="ms-review-avatar-small">
          <img src={form.photoPreview || 'https://via.placeholder.com/150'} alt="Admin" />
        </div>
        <div className="ms-review-title-group">
          <h3>{form.firstName} {form.lastName}</h3>
          <p>{form.username} • {form.email} <span className="ms-tag-success">Verified</span></p>
        </div>
      </div>

      <div className="ms-review-grid">
        <div className="ms-review-box">
          <h4>Account Profile</h4>
          <div className="ms-review-row"><span>Mobile:</span> <strong>{form.phone}</strong></div>
          <div className="ms-review-row"><span>Password:</span> <strong>{'●'.repeat(8)}</strong></div>
        </div>

        <div className="ms-review-box">
          <h4>Verification Data</h4>
          <div className="ms-review-row"><span>Aadhaar:</span> <strong>{form.adhaarNumber}</strong></div>
          <div className="ms-review-row"><span>PAN:</span> <strong>{form.panNumber}</strong></div>
        </div>
      </div>
    </div>

    {/* Enhanced Professional Consent Box */}
    <div className="ms-legal-notice">
      <div className="ms-legal-header">
        <span className="ms-icon-lock">🔒</span>
        <h4>Security Disclosure & Confirmation</h4>
      </div>
      <div className="ms-legal-body">
        <p>
          I hereby confirm that all details provided are accurate. I acknowledge that 
          <strong> Shramjivi Corp</strong> has logged my session originating from IP 
          <span className="ms-audit-highlight"> {form.ipAddress} </span> at coordinates 
          <span className="ms-audit-highlight"> {form.lat}, {form.lng} </span>.
        </p>
        <p className="ms-legal-subtext">
          Submission of this registration initiates an automated background check. Account 
          access is restricted until approval is granted.
        </p>
      </div>
      <div className="ms-consent-checkbox-wrapper">
        <input 
          type="checkbox" 
          id="consent" 
          checked={form.consent} 
          onChange={e => setForm({...form, consent: e.target.checked})} 
        />
        <label htmlFor="consent">I accept the terms and authorize this registration.</label>
      </div>
    </div>
  </div>
)}
          </div>

          <div className="ms-footer-actions">
            {step > 1 && <button className="ms-btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 3 ? (
              <button className="ms-btn-primary" onClick={() => setStep(step + 1)}>Next</button>
            ) : (
              <button className="ms-btn-primary" disabled={!form.consent || saving} onClick={handleSubmit}>
                {saving ? 'Processing...' : 'Register Account'}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}