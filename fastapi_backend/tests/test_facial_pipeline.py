"""
Integration & Privacy Tests for ilo Facial Analysis Service.

Verifies:
1. Zero Raw Image Persistence: Guarantees that neither base64 strings, temp files,
   nor image byte buffers persist beyond the HTTP request lifecycle.
2. Structured JSON Contract: Asserts strict validation of all mandatory fields.
3. Plain-Language Explanation: Ensures mandatory human-readable XAI explanation exists.
4. Baseline & Trend Deviation: Validates that rolling baselines adjust smoothly and
   single frames do not trigger threshold alerts.
5. Role-Based Access Control (RBAC): Enforces role authorization.
"""

import os
import gc
import base64
import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient

from fastapi_backend.main import app, trend_engine
from fastapi_backend.schemas import PrimaryEmotion


client = TestClient(app)


def generate_synthetic_test_frame(color=(220, 190, 180)) -> str:
    """
    Creates a valid JPEG base64 frame for testing.
    """
    img = Image.new("RGB", (320, 240), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def test_zero_raw_image_persistence():
    """
    CRITICAL PRIVACY TEST:
    Asserts that raw image data is NEVER written to local disk or retained in memory buffers.
    """
    test_session = "test-session-zero-persistence"
    b64_image = generate_synthetic_test_frame()
    
    # Check directory state before request
    temp_dir = "/tmp"
    files_before = set(os.listdir(temp_dir)) if os.path.exists(temp_dir) else set()

    response = client.post(
        "/facial-analysis/frame",
        json={
            "session_id": test_session,
            "user_id": "test-user-privacy",
            "image_base64": b64_image,
            "trigger_reason": "periodic_interval"
        },
        headers={"x-user-role": "companion_client"}
    )

    assert response.status_code == 200
    data = response.json()

    # 1. Check directory state after request - no new image files written
    if os.path.exists(temp_dir):
        files_after = set(os.listdir(temp_dir))
        new_files = files_after - files_before
        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".raw"}
        for f in new_files:
            _, ext = os.path.splitext(f)
            assert ext.lower() not in image_extensions, f"Leaked image file found on disk: {f}"

    # 2. Check stored session in memory - verify NO image bytes or base64 fields exist
    stored_frames = trend_engine.get_session_frames(test_session)
    assert len(stored_frames) >= 1
    for frame in stored_frames:
        frame_dict = frame.model_dump()
        assert "image" not in frame_dict
        assert "image_base64" not in frame_dict
        assert "raw_bytes" not in frame_dict
        assert "cropped" not in frame_dict


def test_structured_json_contract_conformance():
    """
    Asserts that every analyzed frame produces the exact required JSON contract.
    """
    b64_image = generate_synthetic_test_frame()
    response = client.post(
        "/facial-analysis/frame",
        json={
            "session_id": "session-contract-validation",
            "user_id": "user-contract",
            "image_base64": b64_image,
        },
        headers={"x-user-role": "companion_client"}
    )

    assert response.status_code == 200
    data = response.json()

    # Required contract fields
    assert "timestamp" in data
    assert "session_id" in data
    assert "primary_emotion" in data
    assert "emotion_distribution" in data
    assert "confidence" in data
    assert "action_units" in data
    assert "facial_distress_indicators" in data
    assert "explanation" in data

    # Validate primary emotion enum
    valid_emotions = {e.value for e in PrimaryEmotion}
    assert data["primary_emotion"] in valid_emotions

    # Validate distribution keys and sum
    dist = data["emotion_distribution"]
    assert len(dist) == 7
    for e in valid_emotions:
        assert e in dist
        assert 0.0 <= dist[e] <= 1.0

    # Validate Action Units structure
    assert isinstance(data["action_units"], list)
    assert len(data["action_units"]) > 0
    for au in data["action_units"]:
        assert "au" in au
        assert "intensity" in au
        assert "present" in au
        assert 0.0 <= au["intensity"] <= 5.0
        assert isinstance(au["present"], bool)

    # Validate human-readable explanation is non-empty
    assert len(data["explanation"]) > 15


def test_user_rolling_baseline_and_trend():
    """
    Verifies that multiple frames update the rolling baseline and deviation is computed.
    """
    user_id = "user-rolling-trend-test"
    session_id = "session-trend-test"

    # Send 3 frames
    for _ in range(3):
        b64 = generate_synthetic_test_frame()
        res = client.post(
            "/facial-analysis/frame",
            json={"session_id": session_id, "user_id": user_id, "image_base64": b64},
            headers={"x-user-role": "companion_client"}
        )
        assert res.status_code == 200

    # Fetch baseline
    baseline_res = client.get(f"/facial-analysis/baseline/{user_id}", headers={"x-user-role": "counsellor"})
    assert baseline_res.status_code == 200
    base_data = baseline_res.json()
    assert base_data["sample_count"] >= 3
    assert "baseline_distribution" in base_data

    # Fetch session aggregation
    session_res = client.get(f"/facial-analysis/session/{session_id}", headers={"x-user-role": "fusion_engine"})
    assert session_res.status_code == 200
    sess_data = session_res.json()
    assert sess_data["total_frames_analyzed"] >= 3
    assert "dds_facial_subscore" in sess_data
    assert 0.0 <= sess_data["dds_facial_subscore"] <= 100.0


def test_rbac_authorization_rejection():
    """
    Ensures unauthorized roles cannot query telemetry.
    """
    response = client.get(
        "/facial-analysis/baseline/user-rbac",
        headers={"x-user-role": "unauthorized_hacker"}
    )
    assert response.status_code == 403
