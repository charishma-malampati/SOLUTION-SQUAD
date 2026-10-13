import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "BrandShield" in data["service"]


def test_load_demo_data_and_run_scan():
    # 1. Reset first for clean state
    reset_resp = client.post("/api/demo/reset")
    assert reset_resp.status_code == 200

    # 2. Load demo data
    load_resp = client.post("/api/demo/load")
    assert load_resp.status_code == 200
    load_data = load_resp.json()
    assert load_data["brand_name"] == "NovaPay"
    assert load_data["official_social_count"] >= 2
    assert load_data["social_records_count"] >= 5

    # 3. Verify brands endpoint
    brands_resp = client.get("/api/brands")
    assert brands_resp.status_code == 200
    brands = brands_resp.json()
    assert len(brands) >= 1
    novapay_id = brands[0]["id"]

    # 4. Run full scan
    scan_resp = client.post("/api/demo/run-full-scan")
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert scan_data["social_scan"]["status"] == "completed"
    assert scan_data["app_scan"]["status"] == "completed"

    # Official handles/apps should be excluded
    assert scan_data["social_scan"]["excluded_assets_count"] >= 1
    assert scan_data["app_scan"]["excluded_assets_count"] >= 1

    # 5. Verify findings generated
    findings_resp = client.get(f"/api/findings?brand_id={novapay_id}")
    assert findings_resp.status_code == 200
    findings = findings_resp.json()
    assert len(findings) > 0

    # Test finding triage / review update
    first_finding_id = findings[0]["id"]
    patch_resp = client.patch(
        f"/api/findings/{first_finding_id}/review",
        json={"review_status": "false_positive", "reviewer_notes": "Tested in automated test suite."},
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["review_status"] == "false_positive"
    assert updated["reviewer_notes"] == "Tested in automated test suite."

    # 6. Verify dashboard stats endpoint
    stats_resp = client.get(f"/api/stats?brand_id={novapay_id}")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_brands"] >= 1
    assert stats["total_monitored_social"] >= 5
    assert stats["official_assets_excluded"] >= 2

    # 7. Verify CSV report export
    csv_resp = client.get("/api/reports/findings.csv")
    assert csv_resp.status_code == 200
    assert "Finding ID" in csv_resp.text
    assert "NovaPay" in csv_resp.text


def test_supabase_status_endpoint():
    response = client.get("/api/supabase/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "project_ref" in data
    assert "api_key_masked" in data
    # Ensure raw secret is masked and never exposed
    assert "..." in data["api_key_masked"]

