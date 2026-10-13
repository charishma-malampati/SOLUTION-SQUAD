import React, { useState, useEffect, useCallback } from 'react';
import {
  BrandProfile,
  DashboardStats,
  Finding,
  SocialProfileRecord,
  AppListingRecord,
  OfficialSocialAsset,
  OfficialApplication,
  ScanHistory as ScanHistoryType,
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, ActivePage } from './components/Sidebar';
import { FindingDetailModal } from './components/FindingDetailModal';
import { Dashboard } from './pages/Dashboard';
import { ThreatFindings } from './pages/ThreatFindings';
import { SocialMonitoring } from './pages/SocialMonitoring';
import { AppMonitoring } from './pages/AppMonitoring';
import { OfficialAssets } from './pages/OfficialAssets';
import { ScanHistory } from './pages/ScanHistory';
import { ExecutiveReport } from './pages/ExecutiveReport';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<ActivePage>('dashboard');
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [currentBrand, setCurrentBrand] = useState<BrandProfile | null>(null);

  // Brand data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfileRecord[]>([]);
  const [appListings, setAppListings] = useState<AppListingRecord[]>([]);
  const [officialSocial, setOfficialSocial] = useState<OfficialSocialAsset[]>([]);
  const [officialApps, setOfficialApps] = useState<OfficialApplication[]>([]);
  const [scans, setScans] = useState<ScanHistoryType[]>([]);

  // Modal & Loading states
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load brand specific data
  const loadBrandData = useCallback(async (brandId: number) => {
    try {
      const [
        brandDetail,
        statsData,
        findingsData,
        socialData,
        appsData,
        scansData,
      ] = await Promise.all([
        api.getBrand(brandId).catch(() => null),
        api.getStats(brandId).catch(() => null),
        api.getFindings({ brand_id: brandId }).catch(() => []),
        api.getSocialRecords(brandId).catch(() => []),
        api.getAppRecords(brandId).catch(() => []),
        api.getScans(brandId).catch(() => []),
      ]);

      if (brandDetail) {
        setOfficialSocial(brandDetail.official_social_assets || []);
        setOfficialApps(brandDetail.official_applications || []);
      }
      setStats(statsData);
      setFindings(findingsData || []);
      setSocialProfiles(socialData || []);
      setAppListings(appsData || []);
      setScans(scansData || []);
    } catch (err) {
      console.error('Error fetching brand data:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        let bList = await api.getBrands();
        if (bList.length === 0) {
          // If no brand exists, load demo immediately
          await api.loadDemo();
          bList = await api.getBrands();
        }
        setBrands(bList);
        if (bList.length > 0) {
          setCurrentBrand(bList[0]);
          await loadBrandData(bList[0].id);
        }
      } catch (err) {
        console.error('Failed to init BrandShield:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, [loadBrandData]);

  // When brand changes
  const handleSelectBrand = (brand: BrandProfile) => {
    setCurrentBrand(brand);
    loadBrandData(brand.id);
  };

  // Run full scan
  const handleRunScan = async () => {
    if (!currentBrand) return;
    setIsScanning(true);
    try {
      await api.runScan(currentBrand.id, 'full');
      await loadBrandData(currentBrand.id);
    } catch (err: any) {
      alert(`Scan failed: ${err.message || err}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Load demo data
  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      await api.loadDemo();
      const bList = await api.getBrands();
      setBrands(bList);
      const nova = bList.find((b) => b.name === 'NovaPay') || bList[0];
      if (nova) {
        setCurrentBrand(nova);
        await loadBrandData(nova.id);
      }
    } catch (err: any) {
      alert(`Demo loading failed: ${err.message || err}`);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Update finding review status
  const handleUpdateReview = async (
    findingId: number,
    data: { review_status: string; reviewer_notes?: string }
  ) => {
    const updated = await api.updateFindingReview(findingId, data);
    setSelectedFinding(updated);
    if (currentBrand) {
      await loadBrandData(currentBrand.id);
    }
  };

  const riskDist = stats?.risk_distribution || {};
  const criticalThreatCount =
    (riskDist['critical'] || riskDist['Critical'] || 0) +
    (riskDist['high'] || riskDist['High'] || 0);

  if (loadingInitial) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-main)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(0, 240, 255, 0.2)',
              borderTopColor: '#00f0ff',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>BrandShield AI Initializing...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Starting offline deterministic threat detection engines
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        threatCount={criticalThreatCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          brands={brands}
          currentBrand={currentBrand}
          onSelectBrand={handleSelectBrand}
          onRunScan={handleRunScan}
          onLoadDemo={handleLoadDemo}
          isScanning={isScanning}
          isDemoLoading={isDemoLoading}
        />

        {/* View Routing */}
        {currentPage === 'dashboard' && (
          <Dashboard
            brand={currentBrand}
            stats={stats}
            recentFindings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onNavigate={(p) => setCurrentPage(p)}
            onRunScan={handleRunScan}
            isScanning={isScanning}
          />
        )}

        {currentPage === 'findings' && (
          <ThreatFindings
            brandId={currentBrand?.id || 1}
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onRefresh={() => (currentBrand ? loadBrandData(currentBrand.id) : Promise.resolve())}
          />
        )}

        {currentPage === 'social' && (
          <SocialMonitoring
            brandId={currentBrand?.id || 1}
            profiles={socialProfiles}
            onRefresh={() => (currentBrand ? loadBrandData(currentBrand.id) : Promise.resolve())}
            onRunScan={handleRunScan}
            isScanning={isScanning}
          />
        )}

        {currentPage === 'apps' && (
          <AppMonitoring
            brandId={currentBrand?.id || 1}
            apps={appListings}
            onRefresh={() => (currentBrand ? loadBrandData(currentBrand.id) : Promise.resolve())}
            onRunScan={handleRunScan}
            isScanning={isScanning}
          />
        )}

        {currentPage === 'official' && (
          <OfficialAssets
            brandId={currentBrand?.id || 1}
            socialAssets={officialSocial}
            appAssets={officialApps}
            onRefresh={() => (currentBrand ? loadBrandData(currentBrand.id) : Promise.resolve())}
          />
        )}

        {currentPage === 'scans' && (
          <ScanHistory
            scans={scans}
            onRefresh={() => (currentBrand ? loadBrandData(currentBrand.id) : Promise.resolve())}
          />
        )}

        {currentPage === 'report' && <ExecutiveReport brand={currentBrand} />}
      </div>

      {/* Finding Drilldown Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onUpdateReview={handleUpdateReview}
        />
      )}
    </div>
  );
};
