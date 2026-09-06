"""
Longitudinal Baseline & Dynamic Distress Score (DDS) Fusion Engine for ilo.

Rules:
1. Maintains each user's rolling baseline emotion distribution across their last N sessions (e.g. N=5-10).
2. Computes Jensen-Shannon divergence / L1 normalized deviation from the user's personal baseline.
3. NEVER triggers an alert from a single frame.
4. Computes a weighted facial sub-score (0-100) integrated into the multidimensional DDS.
"""

import math
from datetime import datetime
from typing import Dict, List, Optional
from .schemas import StructuredFacialOutput, UserRollingBaseline, PrimaryEmotion


class BaselineAndTrendEngine:
    def __init__(self, window_sessions: int = 7):
        self.window_sessions = window_sessions
        # In-memory storage for user baselines and session frames (backed by encrypted persistence in prod)
        self._user_baselines: Dict[str, UserRollingBaseline] = {}
        self._session_store: Dict[str, List[StructuredFacialOutput]] = {}

    def get_or_create_user_baseline(self, user_id: str) -> UserRollingBaseline:
        """
        Retrieves user's rolling baseline or initializes neutral distribution.
        """
        if user_id not in self._user_baselines:
            self._user_baselines[user_id] = UserRollingBaseline(
                user_id=user_id,
                sample_count=0,
                sessions_tracked=0,
                baseline_distribution={
                    "anger": 0.05,
                    "disgust": 0.03,
                    "fear": 0.04,
                    "happiness": 0.25,
                    "neutral": 0.45,
                    "sadness": 0.12,
                    "surprise": 0.06,
                },
                mean_au12_intensity=1.2,
                mean_au04_intensity=0.6,
                last_updated=datetime.utcnow().isoformat() + "Z"
            )
        return self._user_baselines[user_id]

    def record_frame(self, user_id: str, frame: StructuredFacialOutput):
        """
        Appends frame to active session store and incrementally updates rolling baseline.
        """
        session_id = frame.session_id
        if session_id not in self._session_store:
            self._session_store[session_id] = []
        self._session_store[session_id].append(frame)

        # Update rolling baseline with decaying momentum
        baseline = self.get_or_create_user_baseline(user_id)
        alpha = 0.05  # Slow rolling momentum (prevents transient distress from overwriting true baseline)

        for emotion, prob in frame.emotion_distribution.items():
            current = baseline.baseline_distribution.get(emotion, 0.14)
            baseline.baseline_distribution[emotion] = round(
                (1.0 - alpha) * current + (alpha * prob), 4
            )

        # Update AU rolling means
        au_map = {au.au: au.intensity for au in frame.action_units}
        if "AU12" in au_map:
            baseline.mean_au12_intensity = round(
                (1.0 - alpha) * baseline.mean_au12_intensity + (alpha * au_map["AU12"]), 3
            )
        if "AU04" in au_map:
            baseline.mean_au04_intensity = round(
                (1.0 - alpha) * baseline.mean_au04_intensity + (alpha * au_map["AU04"]), 3
            )

        baseline.sample_count += 1
        baseline.last_updated = datetime.utcnow().isoformat() + "Z"

    def compute_frame_deviation(
        self, user_id: str, frame_distribution: Dict[str, float]
    ) -> float:
        """
        Calculates L1 normalized variation between frame distribution and user's personal baseline.
        Returns a deviation score between 0.0 (identical) and 1.0 (extreme shift).
        """
        baseline = self.get_or_create_user_baseline(user_id)
        base_dist = baseline.baseline_distribution

        l1_diff = 0.0
        for emotion, p in frame_distribution.items():
            q = base_dist.get(emotion, 0.0)
            l1_diff += abs(p - q)

        # Max theoretical L1 distance is 2.0; normalize to 0.0 - 1.0
        normalized_deviation = min(1.0, l1_diff / 2.0)
        return round(normalized_deviation, 3)

    def get_session_frames(self, session_id: str) -> List[StructuredFacialOutput]:
        return self._session_store.get(session_id, [])

    def compute_session_dds_subscore(self, session_id: str, user_id: str) -> Dict[str, float]:
        """
        Aggregates frames from the session to compute the facial subscore for the DDS engine.
        Discounting rule: frames with confidence < 0.40 are downweighted by 75%.
        """
        frames = self.get_session_frames(session_id)
        if not frames:
            return {
                "facial_dds_subscore": 20.0,
                "average_confidence": 0.0,
                "session_deviation": 0.0,
                "total_frames": 0,
            }

        total_weight = 0.0
        weighted_negative_affect = 0.0
        weighted_deviation = 0.0
        conf_sum = 0.0

        for f in frames:
            # Discount low confidence readings
            weight = f.confidence if f.confidence >= 0.40 else (f.confidence * 0.25)
            total_weight += weight
            conf_sum += f.confidence

            # Negative affect sum: sadness, anger, fear
            neg_sum = (
                f.emotion_distribution.get("sadness", 0.0) * 1.0 +
                f.emotion_distribution.get("anger", 0.0) * 0.8 +
                f.emotion_distribution.get("fear", 0.0) * 0.9 -
                f.emotion_distribution.get("happiness", 0.0) * 0.5
            )
            weighted_negative_affect += max(0.0, neg_sum) * weight

            dev = self.compute_frame_deviation(user_id, f.emotion_distribution)
            weighted_deviation += dev * weight

        if total_weight == 0:
            total_weight = 1.0

        avg_neg = weighted_negative_affect / total_weight
        avg_dev = weighted_deviation / total_weight
        avg_conf = conf_sum / len(frames)

        # Facial subscore scaled to 0-100 for DDS engine
        # Combines negative affect magnitude and divergence from personal baseline
        raw_score = (avg_neg * 60.0) + (avg_dev * 40.0)
        facial_subscore = round(float(min(100.0, max(0.0, raw_score))), 1)

        return {
            "facial_dds_subscore": facial_subscore,
            "average_confidence": round(avg_conf, 3),
            "session_deviation": round(avg_dev, 3),
            "total_frames": len(frames),
        }
