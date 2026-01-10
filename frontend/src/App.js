// App.js
import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, X, Loader } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

export default function AuthWebsite() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [showRegPasswords, setShowRegPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  const [regErrors, setRegErrors] = useState({});
  
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const validateRegistration = () => {
    const errors = {};
    
    if (!regData.username) {
      errors.username = 'Username is required';
    } else if (regData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!regData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(regData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (regData.email !== regData.confirmEmail) {
      errors.confirmEmail = 'Emails do not match';
    }
    
    if (!regData.password) {
      errors.password = 'Password is required';
    } else if (regData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (regData.password !== regData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRegistration()) {
      return;
    }

    setLoading(true);
    setRegErrors({});

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: regData.username,
          email: regData.email,
          password: regData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setRegErrors({ general: data.error || 'Registration failed' });
        setLoading(false);
        return;
      }

      setMnemonic(data.mnemonic);
      setShowMnemonic(true);
      setLoading(false);

    } catch (error) {
      console.error('Registration error:', error);
      setRegErrors({ general: 'Failed to connect to server. Make sure the backend is running on http://localhost:3001' });
      setLoading(false);
    }
  };

  const handleMnemonicContinue = () => {
    setShowMnemonic(false);
    setShowRegister(false);
    setCurrentPage('home');
    setRegData({
      username: '',
      email: '',
      confirmEmail: '',
      password: '',
      confirmPassword: ''
    });
    alert('✅ Registration complete! You can now login with your credentials.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: loginData.username,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setSessionToken(data.token);
      setUsername(data.username);
      localStorage.setItem('sessionToken', data.token);
      localStorage.setItem('username', data.username);
      
      setShowLogin(false);
      setCurrentPage('main');
      setLoginData({ username: '', password: '' });
      setLoading(false);

    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to connect to server. Make sure the backend is running on http://localhost:3001');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: sessionToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setSessionToken('');
    setUsername('');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('username');
    setCurrentPage('home');
  };

  if (currentPage === 'home') {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="logo">EduPortal</h1>
            <div className="nav-buttons">
              <button onClick={() => setShowLogin(true)} className="btn-secondary">
                Login
              </button>
              <button onClick={() => setShowRegister(true)} className="btn-primary">
                Register
              </button>
            </div>
          </div>
        </nav>

        <div className="hero">
          <h2 className="hero-title">Welcome to EduPortal</h2>
          <p className="hero-subtitle">Your gateway to comprehensive learning resources</p>
          <div className="subject-grid">
            <div className="subject-card">
              <div className="subject-icon">📐</div>
              <h3>Math Methods</h3>
            </div>
            <div className="subject-card">
              <div className="subject-icon">🔢</div>
              <h3>Math Specialist</h3>
            </div>
            <div className="subject-card">
              <div className="subject-icon">⚛️</div>
              <h3>Physics</h3>
            </div>
            <div className="subject-card">
              <div className="subject-icon">🧪</div>
              <h3>Chemistry</h3>
            </div>
          </div>
        </div>

        {showLogin && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Login</h3>
                <button onClick={() => { setShowLogin(false); setLoginError(''); }} className="close-btn">
                  <X size={24} />
                </button>
              </div>
              
              {loginError && (
                <div className="error-box">{loginError}</div>
              )}

              <div className="form">
                <div className="form-group">
                  <label>Username or Email</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin(e)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="eye-btn"
                    >
                      {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleLogin} disabled={loading} className="btn-primary btn-full">
                  {loading ? (
                    <>
                      <Loader className="spinner" size={20} />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRegister && !showMnemonic && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <h3>Register</h3>
                <button onClick={() => { setShowRegister(false); setRegErrors({}); }} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              {regErrors.general && (
                <div className="error-box">{regErrors.general}</div>
              )}

              <div className="form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={regData.username}
                    onChange={(e) => setRegData({...regData, username: e.target.value})}
                    className={regErrors.username ? 'error' : ''}
                    disabled={loading}
                  />
                  {regErrors.username && <p className="error-text">{regErrors.username}</p>}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({...regData, email: e.target.value})}
                    className={regErrors.email ? 'error' : ''}
                    disabled={loading}
                  />
                  {regErrors.email && <p className="error-text">{regErrors.email}</p>}
                </div>

                <div className="form-group">
                  <label>Confirm Email</label>
                  <input
                    type="email"
                    value={regData.confirmEmail}
                    onChange={(e) => setRegData({...regData, confirmEmail: e.target.value})}
                    className={regErrors.confirmEmail ? 'error' : ''}
                    disabled={loading}
                  />
                  {regErrors.confirmEmail && <p className="error-text">{regErrors.confirmEmail}</p>}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <input
                      type={showRegPasswords.password ? 'text' : 'password'}
                      value={regData.password}
                      onChange={(e) => setRegData({...regData, password: e.target.value})}
                      className={regErrors.password ? 'error' : ''}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPasswords({...showRegPasswords, password: !showRegPasswords.password})}
                      className="eye-btn"
                    >
                      {showRegPasswords.password ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {regErrors.password && <p className="error-text">{regErrors.password}</p>}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <input
                      type={showRegPasswords.confirmPassword ? 'text' : 'password'}
                      value={regData.confirmPassword}
                      onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                      className={regErrors.confirmPassword ? 'error' : ''}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPasswords({...showRegPasswords, confirmPassword: !showRegPasswords.confirmPassword})}
                      className="eye-btn"
                    >
                      {showRegPasswords.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {regErrors.confirmPassword && <p className="error-text">{regErrors.confirmPassword}</p>}
                </div>

                <button onClick={handleRegisterSubmit} disabled={loading} className="btn-primary btn-full">
                  {loading ? (
                    <>
                      <Loader className="spinner" size={20} />
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMnemonic && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>🔐 Save Your Recovery Phrase</h3>
              <p className="modal-text">
                Store this phrase safely. You'll need it to recover your account if you forget your username or password.
              </p>
              <div className="mnemonic-box">{mnemonic}</div>
              <div className="success-box">
                ✅ <strong>Email Sent!</strong> We've also sent this recovery phrase to your email address.
              </div>
              <div className="warning-box">
                <strong>Warning:</strong> Write this down and keep it in a safe place. We cannot recover this for you.
              </div>
              <button onClick={handleMnemonicContinue} className="btn-primary btn-full">
                I've Saved It - Continue
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentPage === 'main') {
    return (
      <div className="app app-main">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="logo">EduPortal</h1>
            <div className="nav-buttons">
              <span className="welcome-text">Welcome, <strong>{username}</strong>!</span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <h2 className="main-title">Choose Your Subject</h2>
          <div className="main-grid">
            <div className="main-card">
              <div className="main-icon">📐</div>
              <h3>Math Methods</h3>
              <p>Comprehensive mathematical methods and techniques</p>
            </div>
            <div className="main-card">
              <div className="main-icon">🔢</div>
              <h3>Math Specialist</h3>
              <p>Advanced mathematics for specialists</p>
            </div>
            <div className="main-card">
              <div className="main-icon">⚛️</div>
              <h3>Physics</h3>
              <p>Explore the laws of nature and the universe</p>
            </div>
            <div className="main-card">
              <div className="main-icon">🧪</div>
              <h3>Chemistry</h3>
              <p>Discover the science of matter and its properties</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}