import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useColors } from '../hooks/useColors';
import { LoginFormData, SignupFormData } from '../types';
import '../styles/colors.css';

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
  const { colors, utils } = useColors();

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
      
      // If it's a duplicate email error, suggest switching to sign in
      if (err.response?.status === 409) {
        error(`${errorMessage} Try switching to the "Sign In" tab instead.`);
        // Optionally auto-switch to sign in tab after a delay
        setTimeout(() => {
          setIsSignUp(false);
        }, 3000);
      } else {
        error(errorMessage);
      }
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
      background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.secondary[600]} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        ...utils.getCardStyle(),
        borderRadius: '16px',
        padding: '3rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: `0 25px 50px ${utils.withOpacity(colors.neutral[900], 0.15)}`
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '88px',
            height: '88px',
            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.secondary[500]} 100%)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.2rem',
            boxShadow: `0 8px 32px ${utils.withOpacity(colors.primary[500], 0.3)}`
          }}>
            🎥
          </div>
          <h1 style={{ 
            color: colors.text.primary, 
            marginBottom: '0.75rem',
            fontSize: '2rem',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            VideoConference
          </h1>
          <p style={{ 
            color: colors.text.secondary, 
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '400'
          }}>
            {isSignUp ? 'Create your VideoConference account' : 'Welcome back to VideoConference'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          marginBottom: '2.5rem',
          background: colors.neutral[100],
          borderRadius: '12px',
          padding: '6px',
          border: `1px solid ${colors.neutral[200]}`
        }}>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              background: !isSignUp ? colors.primary[500] : 'transparent',
              color: !isSignUp ? colors.text.inverse : colors.text.secondary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: !isSignUp ? `0 2px 8px ${utils.withOpacity(colors.primary[500], 0.3)}` : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              background: isSignUp ? colors.primary[500] : 'transparent',
              color: isSignUp ? colors.text.inverse : colors.text.secondary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSignUp ? `0 2px 8px ${utils.withOpacity(colors.primary[500], 0.3)}` : 'none'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        {!isSignUp ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1.75rem' }}>
              <label 
                htmlFor="loginEmail" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: '0.95rem'
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
                  ...utils.getInputStyle(),
                  padding: '0.875rem 1.125rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary[500];
                  e.target.style.boxShadow = `0 0 0 3px ${utils.withOpacity(colors.primary[500], 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.neutral[300];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '2.25rem' }}>
              <label 
                htmlFor="loginPassword" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: '0.95rem'
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
                  ...utils.getInputStyle(),
                  padding: '0.875rem 1.125rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary[500];
                  e.target.style.boxShadow = `0 0 0 3px ${utils.withOpacity(colors.primary[500], 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.neutral[300];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...utils.getButtonStyle('primary'),
                width: '100%',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '1.5rem',
                background: isLoading ? colors.neutral[400] : `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                opacity: isLoading ? 0.7 : 1,
                transform: isLoading ? 'none' : 'translateY(0px)',
                boxShadow: isLoading ? 'none' : `0 4px 12px ${utils.withOpacity(colors.primary[500], 0.4)}`
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${utils.withOpacity(colors.primary[500], 0.4)}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${utils.withOpacity(colors.primary[500], 0.4)}`;
                }
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit}>
            <div style={{ marginBottom: '1.75rem' }}>
              <label 
                htmlFor="signupFullName" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: '0.95rem'
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
                  ...utils.getInputStyle(),
                  padding: '0.875rem 1.125rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary[500];
                  e.target.style.boxShadow = `0 0 0 3px ${utils.withOpacity(colors.primary[500], 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.neutral[300];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label 
                htmlFor="signupEmail" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: '0.95rem'
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
                  ...utils.getInputStyle(),
                  padding: '0.875rem 1.125rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary[500];
                  e.target.style.boxShadow = `0 0 0 3px ${utils.withOpacity(colors.primary[500], 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.neutral[300];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '2.25rem' }}>
              <label 
                htmlFor="signupPassword" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: '0.95rem'
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
                  ...utils.getInputStyle(),
                  padding: '0.875rem 1.125rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box'
                }}
                placeholder="Choose a password (min 6 characters)"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary[500];
                  e.target.style.boxShadow = `0 0 0 3px ${utils.withOpacity(colors.primary[500], 0.1)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.neutral[300];
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...utils.getButtonStyle('primary'),
                width: '100%',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '1.5rem',
                background: isLoading ? colors.neutral[400] : `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                opacity: isLoading ? 0.7 : 1,
                transform: isLoading ? 'none' : 'translateY(0px)',
                boxShadow: isLoading ? 'none' : `0 4px 12px ${utils.withOpacity(colors.primary[500], 0.4)}`
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${utils.withOpacity(colors.primary[500], 0.4)}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${utils.withOpacity(colors.primary[500], 0.4)}`;
                }
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Demo Credentials (only show on sign in) */}
        {!isSignUp && (
          <div style={{
            marginTop: '2.5rem',
            padding: '1.25rem 1.5rem',
            background: `linear-gradient(135deg, ${colors.semantic.info.light} 0%, ${utils.withOpacity(colors.semantic.info.light, 0.7)} 100%)`,
            borderRadius: '12px',
            border: `1px solid ${colors.semantic.info.main}`,
            boxShadow: `0 2px 8px ${utils.withOpacity(colors.semantic.info.main, 0.15)}`
          }}>
            <h4 style={{ 
              color: colors.semantic.info.text, 
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🚀 Demo Credentials
            </h4>
            <div style={{ 
              fontSize: '0.9rem', 
              color: colors.semantic.info.text,
              lineHeight: '1.6',
              marginBottom: '0.75rem'
            }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>Email:</strong> admin@videoconference.com
              </div>
              <div>
                <strong>Password:</strong> admin123
              </div>
            </div>
            <p style={{ 
              fontSize: '0.8rem', 
              color: colors.text.secondary, 
              marginTop: '0.5rem',
              marginBottom: 0,
              fontStyle: 'italic'
            }}>
              💡 Please change the password after first login
            </p>
          </div>
        )}

        {/* Features */}
        <div style={{ 
          marginTop: '2.5rem', 
          textAlign: 'center',
          padding: '1.5rem',
          background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
          borderRadius: '12px',
          border: `1px solid ${colors.neutral[200]}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: colors.text.secondary,
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎥</span>
              <span>Video Calls</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <span>Real-time Chat</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🖥️</span>
              <span>Screen Share</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <span>Calendar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;