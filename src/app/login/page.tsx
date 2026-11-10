'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        // Directly upsert into profiles table to prevent backend trigger crashes
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            email: email,
          });
        }

        if (data.user && data.session === null) {
          setSuccessMessage('Registration successful! Please check your email to confirm.');
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navigation Bar with Logo */}
      <div style={{ padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', position: 'relative', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Image 
              src="/chick-farm-pro-app-icon.svg" 
              alt="Chick Farm Pro Logo" 
              fill 
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#1e293b' }}>Chick Farm Pro</span>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingBottom: '4rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', padding: '1rem' }}>
          
          {/* Header Title & Subtitle */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '-0.03em', margin: 0, color: '#0f172a' }}>
              {isSignUp ? 'Create Account' : 'Login'}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isSignUp ? 'Set up your enterprise profile below' : 'Hi, Welcome back 👋'}
            </p>
          </div>

          {/* Error / Success Alerts */}
          {errorMessage && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', color: '#15803d', fontSize: '0.8125rem' }}>
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.50rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g. ****@gmail.com"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.50rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.50rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            {!isSignUp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: '#45543c', borderRadius: '0.25rem' }}
                  />
                  Remember Me
                </label>
                <span style={{ color: '#45543c', fontWeight: 500, cursor: 'pointer' }}>
                  Forgot Password?
                </span>
              </div>
            )}

            {/* Olive Green Primary Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                backgroundColor: '#45543c',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(69, 84, 60, 0.25)',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}
            </button>
          </form>

          {/* Tab Toggle Link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMessage(''); setSuccessMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#45543c', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Not registered yet?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMessage(''); setSuccessMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#45543c', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Create an account ↗
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}