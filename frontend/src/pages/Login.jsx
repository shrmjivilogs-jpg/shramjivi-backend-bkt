import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_BASE = 'https://shramjivi-backend-h7ek.onrender.com';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/login`, form);
      const { token, user } = res.data;

      // Local storage mein data save karein
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ FIXED: Shart hata di hai, ab authenticate hone par seedha Dashboard jayega
      navigate('/dashboard'); 

    } catch (err) {
      setError('Invalid username or password. Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-container">
        {/* Left Side: Brand Visual */}
        <div className="login-visual">
          <div className="visual-content">
            <img src="/logo.png" alt="Shramjivi Logo" className="visual-logo" />
            <h1>Shramjivi Goodshed</h1>
            <p>Management System v2.0</p>
            <div className="status-badge">● System Online</div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-area">
          <div className="form-box">
            <header>
              <h2>Welcome Back</h2>
              <p>Please enter your admin credentials</p>
            </header>

            {error && <div className="error-toast">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="modern-input">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="admin_user"
                  required
                />
              </div>

              <div className="modern-input">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="loader"></span> : 'Authenticate'}
              </button>
            </form>

            <footer>
              <p>Need support? <Link to="/setup">Contact Admin</Link></p>
              <div className="security-tag">
                <span className="shield-icon">🛡️</span> Secure Enterprise Connection
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}