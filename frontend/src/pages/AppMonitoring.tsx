import React, { useState } from 'react';
import { AppListingRecord } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  Upload,
  Plus,
  Play,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/api';

interface AppMonitoringProps {
  brandId: number;
  apps: AppListingRecord[];
  onRefresh: () => Promise<void>;
  onRunScan: () => Promise<void>;
  isScanning: boolean;
}

export const AppMonitoring: React.FC<AppMonitoringProps> = ({
  brandId,
  apps,
  onRefresh,
  onRunScan,
  isScanning,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    store_name: 'google_play',
    app_name: '',
    package_id: '',
    developer_name: '',
    store_url: '',
    description: '',
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await api.uploadAppCsv(brandId, uploadFile);
      setUploadMsg(`Successfully processed CSV: ${res.message || 'Apps imported.'}`);
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
      await api.addAppRecord(brandId, formData);
      await onRefresh();
      setShowAddModal(false);
      setFormData({
        store_name: 'google_play',
        app_name: '',
        package_id: '',
        developer_name: '',
        store_url: '',
        description: '',
      });
    } catch (err: any) {
      alert(`Error creating app listing: ${err.message || err}`);
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
            <Smartphone size={18} color="var(--accent-blue)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-blue)',
              }}
            >
              Mobile Application Perimeter
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Monitored App Listings ({apps.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Candidate apps from Google Play, Apple App Store, and APK mirrors tracked for spoofed package IDs
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
            <Plus size={14} /> Add Candidate App
          </button>
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="btn btn-primary btn-sm"
          >
            <Play size={14} /> {isScanning ? 'Scanning...' : 'Scan App Perimeter'}
          </button>
        </div>
      </div>

      {/* App Listings Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Store / Source</th>
              <th>App Name</th>
              <th>Package ID / Bundle ID</th>
              <th>Developer / Publisher</th>
              <th>Listing Description</th>
              <th style={{ textAlign: 'right' }}>Store Link</th>
            </tr>
          </thead>
          <tbody>
            {apps.length > 0 ? (
              apps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <PlatformIcon platform={app.store_name} size={18} showLabel />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{app.app_name}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      {app.package_id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {app.developer_name}
                    </span>
                  </td>
                  <td style={{ maxWidth: '320px' }}>
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
                      {app.description || 'No description provided'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {app.store_url ? (
                      <a
                        href={app.store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.6rem' }}
                      >
                        Store <ExternalLink size={12} />
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
                  No candidate app store listings found. Use "Import CSV" or "Load Demo".
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Import Mobile Apps CSV</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Import candidate mobile application metadata scraped from Google Play or APK directories.
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
                <FileSpreadsheet size={36} color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem' }} />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  style={{ display: 'block', margin: '0.5rem auto', color: 'var(--text-muted)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Required CSV headers: <code>app_name, package_id, developer_name, store_name</code>
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

      {/* Manual Add Candidate App Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add Candidate Mobile App</h2>
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
                <label className="form-label">Store / Repository Platform</label>
                <select
                  className="form-select"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                >
                  <option value="google_play">Google Play Store</option>
                  <option value="apple_app_store">Apple App Store</option>
                  <option value="third_party_apk">Third-Party APK / Mirror</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Application Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. NovaPay Quick Loans"
                    value={formData.app_name}
                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Package Name / Bundle ID</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. com.novapay.quickloans"
                    value={formData.package_id}
                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Developer / Publisher Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Rogue FinTech Ltd"
                  value={formData.developer_name}
                  onChange={(e) => setFormData({ ...formData, developer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Store URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={formData.store_url}
                  onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Listing Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Official NovaPay fast credit loan app. Instant money without verification..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
