import React, { useState } from 'react';
import { OfficialSocialAsset, OfficialApplication } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Smartphone,
  Share2,
  X,
} from 'lucide-react';
import { api } from '../services/api';

interface OfficialAssetsProps {
  brandId: number;
  socialAssets: OfficialSocialAsset[];
  appAssets: OfficialApplication[];
  onRefresh: () => Promise<void>;
}

export const OfficialAssets: React.FC<OfficialAssetsProps> = ({
  brandId,
  socialAssets,
  appAssets,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'apps'>('social');
  const [showAddSocialModal, setShowAddSocialModal] = useState(false);
  const [showAddAppModal, setShowAddAppModal] = useState(false);

  // Social form
  const [socialForm, setSocialForm] = useState({
    platform: 'twitter',
    handle: '',
    url: '',
    verified_badge: true,
  });

  // App form
  const [appForm, setAppForm] = useState({
    store: 'google_play',
    package_id: '',
    app_name: '',
    publisher_name: '',
    store_url: '',
  });

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addOfficialSocial(brandId, socialForm);
      await onRefresh();
      setShowAddSocialModal(false);
      setSocialForm({
        platform: 'twitter',
        handle: '',
        url: '',
        verified_badge: true,
      });
    } catch (err: any) {
      alert(`Error adding official asset: ${err.message || err}`);
    }
  };

  const handleDeleteSocial = async (id: number) => {
    if (!confirm('Remove this official social asset from the whitelist?')) return;
    try {
      await api.deleteOfficialSocial(brandId, id);
      await onRefresh();
    } catch (err: any) {
      alert(`Error deleting asset: ${err.message || err}`);
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addOfficialApp(brandId, appForm);
      await onRefresh();
      setShowAddAppModal(false);
      setAppForm({
        store: 'google_play',
        package_id: '',
        app_name: '',
        publisher_name: '',
        store_url: '',
      });
    } catch (err: any) {
      alert(`Error adding official app: ${err.message || err}`);
    }
  };

  const handleDeleteApp = async (id: number) => {
    if (!confirm('Remove this registered app from the whitelist?')) return;
    try {
      await api.deleteOfficialApp(brandId, id);
      await onRefresh();
    } catch (err: any) {
      alert(`Error deleting app: ${err.message || err}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div
        className="cyber-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--safe-green)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--safe-green)',
              }}
            >
              Zero False-Positive Protection
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Official Brand Whitelist Assets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Legitimate verified handles and registered application IDs excluded from threat scoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'social' ? (
            <button
              onClick={() => setShowAddSocialModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} /> Register Official Handle
            </button>
          ) : (
            <button
              onClick={() => setShowAddAppModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} /> Register Official App ID
            </button>
          )}
        </div>
      </div>

      {/* Explanatory Architecture Callout */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
        }}
      >
        <Lock size={20} color="var(--safe-green)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>
            Deterministic Exclusion Architecture
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            To eliminate false-positive fatigue in SOC operations, the BrandShield engine executes an exclusion
            filter <strong>prior</strong> to anomaly computation. Any candidate matching an authorized handle or
            bearing an authorized package ID registered to a validated publisher is tagged as
            <strong style={{ color: 'var(--safe-green)' }}> EXCLUDED / SAFE</strong> and excluded from threat alerts.
            If an unauthorized publisher registers an official package ID, the engine raises an immediate identity conflict alert!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('social')}
          className={`btn ${activeTab === 'social' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ gap: '0.4rem' }}
        >
          <Share2 size={14} />
          <span>Official Social Handles ({socialAssets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`btn ${activeTab === 'apps' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ gap: '0.4rem' }}
        >
          <Smartphone size={14} />
          <span>Registered Mobile Apps ({appAssets.length})</span>
        </button>
      </div>

      {/* Tab 1: Official Social Assets */}
      {activeTab === 'social' && (
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Official Handle</th>
                <th>Verified Badge</th>
                <th>Registered URL</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {socialAssets.length > 0 ? (
                socialAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <PlatformIcon platform={asset.platform} size={18} showLabel />
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--safe-green)',
                        }}
                      >
                        @{asset.handle}
                      </span>
                    </td>
                    <td>
                      {asset.verified_badge ? (
                        <span className="badge badge-safe">OFFICIAL VERIFIED</span>
                      ) : (
                        <span className="badge badge-low">REGISTERED</span>
                      )}
                    </td>
                    <td>
                      {asset.url ? (
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--accent-cyan)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                          }}
                        >
                          Visit Profile <ExternalLink size={12} />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteSocial(asset.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#f43f5e', padding: '0.25rem 0.5rem' }}
                        title="Remove from whitelist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No official social assets registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Registered Mobile Applications */}
      {activeTab === 'apps' && (
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Store Platform</th>
                <th>Registered Application Name</th>
                <th>Authorized Package ID / Bundle ID</th>
                <th>Verified Publisher</th>
                <th>Protection Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appAssets.length > 0 ? (
                appAssets.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <PlatformIcon platform={app.store} size={18} showLabel />
                    </td>
                    <td style={{ fontWeight: 700 }}>{app.app_name}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--safe-green)',
                        }}
                      >
                        {app.package_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {app.publisher_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-safe">AUTHENTIC ASSET</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#f43f5e', padding: '0.25rem 0.5rem' }}
                        title="Remove from whitelist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No official applications registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Social Modal */}
      {showAddSocialModal && (
        <div className="modal-overlay" onClick={() => setShowAddSocialModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Register Official Handle</h2>
              <button
                onClick={() => setShowAddSocialModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSocial}>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="telegram">Telegram</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Official Handle / Username</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. NovaPay"
                  value={socialForm.handle}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, handle: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://twitter.com/NovaPay"
                  value={socialForm.url}
                  onChange={(e) =>
                    setSocialForm({ ...socialForm, url: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={socialForm.verified_badge}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, verified_badge: e.target.checked })
                    }
                  />
                  Verified by platform (Official badge)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSocialModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add to Whitelist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add App Modal */}
      {showAddAppModal && (
        <div className="modal-overlay" onClick={() => setShowAddAppModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Register Official Application</h2>
              <button
                onClick={() => setShowAddAppModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddApp}>
              <div className="form-group">
                <label className="form-label">Store / Platform</label>
                <select
                  className="form-select"
                  value={appForm.store}
                  onChange={(e) => setAppForm({ ...appForm, store: e.target.value })}
                >
                  <option value="google_play">Google Play Store</option>
                  <option value="apple_app_store">Apple App Store</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Application Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. NovaPay — Mobile Banking & Payments"
                  value={appForm.app_name}
                  onChange={(e) => setAppForm({ ...appForm, app_name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Package ID / Bundle ID</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. com.novapay.app"
                    value={appForm.package_id}
                    onChange={(e) =>
                      setAppForm({ ...appForm, package_id: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Authorized Publisher</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. NovaPay Technologies Inc."
                    value={appForm.publisher_name}
                    onChange={(e) =>
                      setAppForm({ ...appForm, publisher_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add to Whitelist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
