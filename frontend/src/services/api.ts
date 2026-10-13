import {
  BrandProfile,
  OfficialSocialAsset,
  OfficialApplication,
  SocialProfileRecord,
  AppListingRecord,
  Finding,
  ScanHistory,
  DashboardStats,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Brand Management
  async getBrands(): Promise<BrandProfile[]> {
    const res = await fetch(`${API_BASE}/brands`);
    return handleResponse<BrandProfile[]>(res);
  },

  async getBrand(id: number): Promise<BrandProfile> {
    const res = await fetch(`${API_BASE}/brands/${id}`);
    return handleResponse<BrandProfile>(res);
  },

  async createBrand(data: Partial<BrandProfile>): Promise<BrandProfile> {
    const res = await fetch(`${API_BASE}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<BrandProfile>(res);
  },

  // Official Protected Assets Whitelist
  async addOfficialSocial(
    brandId: number,
    data: { platform: string; handle: string; url?: string; verified_badge?: boolean; notes?: string }
  ): Promise<OfficialSocialAsset> {
    const res = await fetch(`${API_BASE}/brands/${brandId}/official-social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<OfficialSocialAsset>(res);
  },

  async deleteOfficialSocial(brandId: number, assetId: number): Promise<void> {
    await fetch(`${API_BASE}/brands/${brandId}/official-social/${assetId}`, {
      method: 'DELETE',
    });
  },

  async addOfficialApp(
    brandId: number,
    data: { app_name: string; package_id: string; store: string; publisher_name: string; store_url?: string }
  ): Promise<OfficialApplication> {
    const res = await fetch(`${API_BASE}/brands/${brandId}/official-apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<OfficialApplication>(res);
  },

  async deleteOfficialApp(brandId: number, appId: number): Promise<void> {
    await fetch(`${API_BASE}/brands/${brandId}/official-apps/${appId}`, {
      method: 'DELETE',
    });
  },

  // Social Monitoring
  async getSocialRecords(brandId?: number): Promise<SocialProfileRecord[]> {
    const qs = brandId ? `?brand_id=${brandId}` : '';
    const res = await fetch(`${API_BASE}/social${qs}`);
    return handleResponse<SocialProfileRecord[]>(res);
  },

  async addSocialRecord(
    brandId: number,
    data: Partial<SocialProfileRecord>
  ): Promise<SocialProfileRecord> {
    const res = await fetch(`${API_BASE}/social?brand_id=${brandId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SocialProfileRecord>(res);
  },

  async uploadSocialCsv(brandId: number, file: File): Promise<any> {
    const form = new FormData();
    form.append('brand_id', brandId.toString());
    form.append('file', file);
    const res = await fetch(`${API_BASE}/social/upload-csv`, {
      method: 'POST',
      body: form,
    });
    return handleResponse<any>(res);
  },

  // App Store Monitoring
  async getAppRecords(brandId?: number): Promise<AppListingRecord[]> {
    const qs = brandId ? `?brand_id=${brandId}` : '';
    const res = await fetch(`${API_BASE}/apps${qs}`);
    return handleResponse<AppListingRecord[]>(res);
  },

  async addAppRecord(
    brandId: number,
    data: Partial<AppListingRecord>
  ): Promise<AppListingRecord> {
    const res = await fetch(`${API_BASE}/apps?brand_id=${brandId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AppListingRecord>(res);
  },

  async uploadAppCsv(brandId: number, file: File): Promise<any> {
    const form = new FormData();
    form.append('brand_id', brandId.toString());
    form.append('file', file);
    const res = await fetch(`${API_BASE}/apps/upload-csv`, {
      method: 'POST',
      body: form,
    });
    return handleResponse<any>(res);
  },

  // Findings
  async getFindings(params?: {
    brand_id?: number;
    risk_category?: string;
    review_status?: string;
    search?: string;
    asset_type?: string;
  }): Promise<Finding[]> {
    const q = new URLSearchParams();
    if (params?.brand_id) q.append('brand_id', params.brand_id.toString());
    if (params?.risk_category && params.risk_category !== 'all') {
      q.append('risk_category', params.risk_category.toLowerCase());
    }
    if (params?.review_status && params.review_status !== 'all') {
      q.append('review_status', params.review_status.toLowerCase());
    }
    if (params?.search) q.append('search', params.search);
    if (params?.asset_type && params.asset_type !== 'all') {
      q.append('asset_type', params.asset_type);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`${API_BASE}/findings${qs}`);
    return handleResponse<Finding[]>(res);
  },

  async getFinding(id: number): Promise<Finding> {
    const res = await fetch(`${API_BASE}/findings/${id}`);
    return handleResponse<Finding>(res);
  },

  async updateFindingReview(
    findingId: number,
    data: { review_status: string; reviewer_notes?: string }
  ): Promise<Finding> {
    const res = await fetch(`${API_BASE}/findings/${findingId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Finding>(res);
  },

  // Scans
  async getScans(brandId?: number): Promise<ScanHistory[]> {
    const qs = brandId ? `?brand_id=${brandId}` : '';
    const res = await fetch(`${API_BASE}/scans${qs}`);
    return handleResponse<ScanHistory[]>(res);
  },

  async runScan(brandId: number, scanType: string = 'full'): Promise<any> {
    const res = await fetch(`${API_BASE}/scans/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: brandId, scan_type: scanType }),
    });
    return handleResponse<any>(res);
  },

  // Statistics
  async getStats(brandId?: number): Promise<DashboardStats> {
    const qs = brandId ? `?brand_id=${brandId}` : '';
    const res = await fetch(`${API_BASE}/stats${qs}`);
    return handleResponse<DashboardStats>(res);
  },

  // Reports
  getFindingsCsvUrl(brandId?: number): string {
    return brandId ? `${API_BASE}/reports/findings.csv?brand_id=${brandId}` : `${API_BASE}/reports/findings.csv`;
  },

  // 1-Click Demo Sandbox
  async loadDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/load`, {
      method: 'POST',
    });
    return handleResponse<any>(res);
  },
};
