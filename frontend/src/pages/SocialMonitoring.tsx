import React, { useState } from 'react';
import { SocialProfileRecord } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  Upload,
  Plus,
  Play,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Users,
} from 'lucide-react';
import { api } from '../services/api';

interface SocialMonitoringProps {
  brandId: number;
  profiles: SocialProfileRecord[];
  onRefresh: () => Promise<void>;
  onRunScan: () => Promise<void>;
  isScanning: boolean;
}

export const SocialMonitoring: React.FC<SocialMonitoringProps> = ({
  brandId,
  profiles,
  onRefresh,
  onRunScan,
  isScanning,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // New profile form state
  const [formData, setFormData] = useState({
    platform: 'twitter',
    username: '',
    display_name: '',
    profile_url: '',
    bio: '',
    follower_count: 0,
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await api.uploadSocialCsv(brandId, uploadFile);
      setUploadMsg(`Successfully processed CSV: ${res.message || 'Records imported.'}`);
      await onRefresh();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadMsg(null);
        setUploadFile(null);
      }, 1500);
    } catch (err: any) {
      alert(`CSV Upload Failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addSocialRecord(brandId, formData);
      await onRefresh();
      setShowAddModal(false);
      setFormData({
        platform: 'twitter',
        username: '',
        display_name: '',
        profile_url: '',
        bio: '',
        follower_count: 0,
      });
    } catch (err: any) {
      alert(`Error creating profile: ${err.message || err}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Controls Banner */}
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
            <Users size={18} color="var(--accent-cyan)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-cyan)',
              }}
            >
              Social Perimeter Defense
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Social Media Candidates ({profiles.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitored accounts evaluated for brand hijacking, visual homoglyphs, and scam bios
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-outline btn-sm"
          >
            <Plus size={14} /> Add Candidate
          </button>
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="btn btn-primary btn-sm"
          >
            <Play size={14} /> {isScanning ? 'Scanning...' : 'Scan Social Perimeter'}
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Account Username / Handle</th>
              <th>Display Name</th>
              <th>Bio & Content Analysis</th>
              <th>Followers</th>
              <th style={{ textAlign: 'right' }}>Source URL</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length > 0 ? (
              profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <PlatformIcon platform={p.platform} size={18} showLabel />
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      @{p.username}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.display_name || '—'}</td>
                  <td style={{ maxWidth: '380px' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.bio || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {p.follower_count?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.profile_url ? (
                      <a
                        href={p.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.6rem' }}
                      >
                        Inspect <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No candidate social profiles found. Use "Import CSV" or "Load Demo" to populate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Import Social Profiles CSV</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload candidate profiles gathered from social monitoring scrapers or API streams.
            </p>

            <form onSubmit={handleFileUpload}>
              <div
                style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                }}
              >
                <FileSpreadsheet size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 0.5rem' }} />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  style={{ display: 'block', margin: '0.5rem auto', color: 'var(--text-muted)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Required CSV headers: <code>platform, username</code> (optional: <code>display_name, bio, profile_url, follower_count</code>)
                </span>
              </div>

              {uploadMsg && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CheckCircle2 size={16} /> {uploadMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="btn btn-primary btn-sm"
                >
                  {uploading ? 'Parsing CSV...' : 'Import Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Candidate Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add Social Candidate</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="telegram">Telegram</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Username / Handle</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. NovaPay_care"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. NovaPay Helpdesk"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://twitter.com/NovaPay_care"
                  value={formData.profile_url}
                  onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio Description / Posts</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Official customer support. Urgent KYC verification or refunds..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Followers Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.follower_count}
                  onChange={(e) =>
                    setFormData({ ...formData, follower_count: Number(e.target.value) })
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
