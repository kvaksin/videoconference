import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { LoginFormData, SignupFormData } from '../types';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [signupData, setSignupData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { login, signup } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(loginData.email, loginData.password);
      success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!signupData.fullName || !signupData.email || !signupData.password) {
      error('Please fill in all fields');
      return;
    }

    if (signupData.fullName.trim().length < 2) {
      error('Full name must be at least 2 characters long');
      return;
    }

    if (signupData.password.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      await signup(signupData.fullName, signupData.email, signupData.password);
      success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Signup failed';
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            🎥
          </div>
          <h1 style={{ 
            color: '#2c3e50', 
            marginBottom: '0.5rem',
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            Video Conference
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {isSignUp ? 'Create your account' : 'Sign in to start or join meetings'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          marginBottom: '2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: !isSignUp ? '#667eea' : 'transparent',
              color: !isSignUp ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isSignUp ? '#667eea' : 'transparent',
              color: isSignUp ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        {!isSignUp ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="loginEmail" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#2c3e50',
                  fontWeight: '500'
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="loginEmail"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="loginPassword" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#2c3e50',
                  fontWeight: '500'
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="loginPassword"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="signupFullName" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#2c3e50',
                  fontWeight: '500'
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                id="signupFullName"
                name="fullName"
                value={signupData.fullName}
                onChange={handleSignupChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="signupEmail" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#2c3e50',
                  fontWeight: '500'
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="signupEmail"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="signupPassword" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#2c3e50',
                  fontWeight: '500'
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="signupPassword"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Choose a password (min 6 characters)"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Demo Credentials (only show on sign in) */}
        {!isSignUp && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e1e8ed'
          }}>
            <h4 style={{ 
              color: '#2c3e50', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Demo Credentials:
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              <strong>Email:</strong> admin@videoconference.com<br />
              <strong>Password:</strong> admin123
            </div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#999', 
              marginTop: '0.5rem',
              marginBottom: 0
            }}>
              Please change the password after first login
            </p>
          </div>
        )}

        {/* Features */}
        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <p style={{ margin: 0 }}>
            🎥 Video Calls • 💬 Chat • 🖥️ Screen Share • 📅 Calendar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;