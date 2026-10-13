import React, { useState, useEffect } from 'react';
import { BrandProfile } from '../types';
import {
  Shield,
  Play,
  Sparkles,
  CheckCircle,
  Activity,
  Layers,
  Database,
  X,
  RefreshCw,
} from 'lucide-react';
import { testSupabaseConnection, SupabaseConnectionStatus } from '../services/supabase';

interface NavbarProps {
  brands: BrandProfile[];
  currentBrand: BrandProfile | null;
  onSelectBrand: (brand: BrandProfile) => void;
  onRunScan: () => Promise<void>;
  onLoadDemo: () => Promise<void>;
  isScanning: boolean;
  isDemoLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  brands,
  currentBrand,
  onSelectBrand,
  onRunScan,
  onLoadDemo,
  isScanning,
  isDemoLoading,
}) => {
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);

  const checkSupabase = async () => {
    setTestingSupabase(true);
    try {
      const res = await testSupabaseConnection();
      setSupabaseStatus(res);
    } catch {
      // ignore
    } finally {
      setTestingSupabase(false);
    }
  };

  useEffect(() => {
    checkSupabase();
  }, []);

  const handleDemoClick = async () => {
    try {
      await onLoadDemo();
      setDemoNotice('NovaPay demo loaded with synthetic threat candidates!');
      setTimeout(() => setDemoNotice(null), 4000);
    } catch (err: any) {
      alert(`Failed to load demo: ${err.message || err}`);
    }
  };

  return (
    <header className="top-navbar">
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #00f0ff 100%)',
              color: '#030712',
              padding: '0.45rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
            }}
          >
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BrandShield AI
            </span>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Digital Risk Protection
            </div>
          </div>
        </div>

        {/* Brand Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
          <Layers size={15} color="var(--text-dim)" />
          <select
            className="form-select"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              width: 'auto',
              minWidth: '150px',
              height: '34px',
            }}
            value={currentBrand?.id || ''}
            onChange={(e) => {
              const b = brands.find((x) => x.id === Number(e.target.value));
              if (b) onSelectBrand(b);
            }}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                Brand: {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {demoNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CheckCircle size={14} /> {demoNotice}
          </div>
        )}

        {/* Supabase Cloud Connection Indicator */}
        <button
          onClick={() => setShowSupabaseModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: supabaseStatus?.connected
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(234, 179, 8, 0.12)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${
              supabaseStatus?.connected
                ? 'rgba(16, 185, 129, 0.35)'
                : 'rgba(234, 179, 8, 0.35)'
            }`,
            fontSize: '0.75rem',
            color: supabaseStatus?.connected ? '#34d399' : '#fde047',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Click to view Supabase connection details"
        >
          <Database size={13} />
          <span style={{ fontWeight: 600 }}>
            {supabaseStatus?.connected ? 'Supabase Connected' : 'Supabase Syncing...'}
          </span>
        </button>

        {/* SOC Engine Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <span
            className="radar-dot"
            style={{ background: isScanning ? '#f59e0b' : '#10b981' }}
          />
          <span style={{ fontWeight: 600 }}>
            {isScanning ? 'Scan In Progress' : 'Engine Ready'}
          </span>
        </div>

        {/* 1-Click Load Demo Button */}
        <button
          onClick={handleDemoClick}
          disabled={isDemoLoading}
          className="btn btn-secondary btn-sm"
          title="Load 1-Click Demo Data (NovaPay with Homoglyphs, Rogue APKs, Official Assets)"
          style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
        >
          <Sparkles size={14} color="#00f0ff" />
          <span>{isDemoLoading ? 'Loading Demo...' : 'Load Demo (NovaPay)'}</span>
        </button>

        {/* Run Full Scan Button */}
        <button
          onClick={onRunScan}
          disabled={isScanning || !currentBrand}
          className="btn btn-primary btn-sm"
        >
          {isScanning ? (
            <>
              <Activity className="animate-spin" size={14} />
              <span>Scanning Platforms...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Run Detection Engine</span>
            </>
          )}
        </button>
      </div>

      {/* Supabase Connection Details Modal */}
      {showSupabaseModal && (
        <div className="modal-overlay" onClick={() => setShowSupabaseModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '0.45rem',
                    borderRadius: '8px',
                  }}
                >
                  <Database size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Supabase Cloud Connection</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Digital Risk Protection Cloud Link
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                <span
                  style={{
                    color: supabaseStatus?.connected ? 'var(--safe-green)' : 'var(--risk-critical)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span
                    className="radar-dot"
                    style={{ background: supabaseStatus?.connected ? '#10b981' : '#f43f5e' }}
                  />
                  {supabaseStatus?.status || 'UNKNOWN'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Ref:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                  {supabaseStatus?.projectRef || 'byccnjctijsbhyxyojpa'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endpoint URL:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#fff' }}>
                  {supabaseStatus?.url || 'https://byccnjctijsbhyxyojpa.supabase.co'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client SDK:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  @supabase/supabase-js v2.x
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auth / GoTrue:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--safe-green)', fontWeight: 600 }}>
                  {supabaseStatus?.version ? `${supabaseStatus.version} (Active)` : 'Online'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Key Type:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Publishable (Public Browser Safe)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Tested at: {supabaseStatus?.testedAt ? new Date(supabaseStatus.testedAt).toLocaleTimeString() : 'Just now'}
              </span>
              <button
                onClick={checkSupabase}
                disabled={testingSupabase}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <RefreshCw size={13} className={testingSupabase ? 'animate-spin' : ''} />
                <span>{testingSupabase ? 'Pinging...' : 'Re-test Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
