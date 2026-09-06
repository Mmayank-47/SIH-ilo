# ilo Facial Analysis & Affective Wellbeing Pipeline (FastAPI Backend)

This microservice implements privacy-first, zero-persistence facial affect detection, facial Action Unit (AU) extraction, longitudinal personal baseline tracking, and Explainable AI (XAI) distress telemetry for the **ilo** trauma-informed companion platform.

---

## 1. Core Architectural Contracts

### Strict Structured JSON Contract
Every analyzed frame returns the standardized JSON contract:

```json
{
  "timestamp": "2026-09-05T23:14:00.000Z",
  "session_id": "session-491",
  "primary_emotion": "sadness",
  "emotion_distribution": {
    "anger": 0.04,
    "disgust": 0.02,
    "fear": 0.08,
    "happiness": 0.05,
    "neutral": 0.28,
    "sadness": 0.49,
    "surprise": 0.04
  },
  "confidence": 0.82,
  "action_units": [
    { "au": "AU04", "intensity": 2.1, "present": true },
    { "au": "AU06", "intensity": 0.2, "present": false },
    { "au": "AU12", "intensity": 0.3, "present": false },
    { "au": "AU15", "intensity": 1.8, "present": true },
    { "au": "AU01", "intensity": 1.4, "present": true },
    { "au": "AU07", "intensity": 0.9, "present": false }
  ],
  "facial_distress_indicators": [
    "reduced_smiling",
    "brow_lowering",
    "lip_corner_depression"
  ],
  "explanation": "Reduced zygomatic smile activation (AU12: 0.3/5.0) paired with corrugator brow-lowering (AU04: 2.1) and depressor anguli sadness pull (AU15: 1.8). Elevated negative affect detected (sadness: 49%), contributing a moderate distress sub-signal to the longitudinal baseline."
}
```

---

## 2. Privacy & Data Handling Guarantees

1. **Zero Raw Image Persistence**:
   - Camera frames sent over HTTPS are buffered strictly in RAM for ephemeral preprocessing.
   - Once cropped and features are computed, image arrays and base64 strings are explicitly purged via Python garbage collection (`del` + `gc.collect()`).
   - No raw image files or video clips are ever written to disk, caches, or cloud object stores.
2. **Encrypted Longitudinal Telemetry & RBAC**:
   - Only non-invertible structured JSON metrics are stored.
   - Enforces strict Role-Based Access Control (RBAC) via the `X-User-Role` header (`fusion_engine`, `counsellor`, `clinical_supervisor`).
3. **Discounting Low-Confidence Readings**:
   - Every reading logs an objective `confidence` score (0.0 to 1.0) based on illumination, pose angle, and visibility.
   - Readings below 0.40 confidence are discounted by 75% in the longitudinal Dynamic Distress Score (DDS) fusion engine.

---

## 3. Dataset Ethics & Realistic Model Evaluation

### Ethical Dataset Notice
- Training and fine-tuning scripts exclusively use publicly licensed Facial Expression Recognition (FER) datasets (such as **AffectNet** and **RAF-DB** under academic/public research terms).
- **Strict Prohibition**: This service strictly forbids using non-public clinical datasets (e.g. the restricted VFEM dataset from the CmdVIT publication), respecting ethical approvals and participant consent boundaries.

### Validation Performance & False Positive Reporting
- In naturalistic and clinically complex populations, even state-of-the-art vision models achieve **45%–50% top-1 accuracy** due to affective blending, cultural expressiveness, and lighting variability.
- Rather than overpromising reliability, the system logs per-class False Positive Rates (FPR) and **never triggers any alert from a single frame**. Facial signals serve exclusively as a weighted sub-score in the longitudinal DDS fusion engine alongside voice, sentiment, and self-report logs.

---

## 4. API Endpoints

- `POST /facial-analysis/frame`: Analyzes single still frame from front camera (20–30s interval or sentiment shift). Returns structured JSON.
- `GET /facial-analysis/baseline/{user_id}`: Returns user's personal rolling baseline distribution over N sessions.
- `GET /facial-analysis/session/{session_id}`: Returns all frame readings for an active session with aggregated facial DDS sub-score.
