"""
FACS Action Unit (AU) Extraction Module for ilo.
Calculates standardized intensity (0.0-5.0) and binary presence for clinical distress AUs:
- AU12 (Lip Corner Puller / Zygomaticus major) -> Positive affect / smiling
- AU06 (Cheek Raiser / Orbicularis oculi) -> Duchenne genuine smile marker
- AU04 (Brow Lowerer / Corrugator supercilii) -> Distress, frustration, depressive frowning
- AU15 (Lip Corner Depressor / Depressor anguli oris) -> Sadness, grief, dysphoria
- AU01 (Inner Brow Raiser / Frontalis pars medialis) -> Worry, apprehension, distress
- AU07 (Lid Tightener / Orbicularis oculi pars palpebralis) -> Sustained stress/tension

Extracts clinical distress indicators linked to depression literature:
- 'reduced_smiling'
- 'brow_lowering'
- 'sustained_tension'
- 'flat_affect'
- 'lip_corner_depression'
"""

import math
from typing import List, Dict, Tuple, Any
from ..schemas import ActionUnit


class FacialActionUnitExtractor:
    def __init__(self):
        # Clinical thresholds for AU presence (0.0 to 5.0 scale, threshold >= 1.0)
        self.presence_threshold = 1.0

    def extract_action_units(self, landmarks: Dict[str, Tuple[float, float]]) -> Tuple[List[ActionUnit], List[str]]:
        """
        Computes AU intensities from normalized geometric facial mesh distances.
        Returns:
            - action_units: List[ActionUnit]
            - facial_distress_indicators: List[str]
        """
        if not landmarks:
            return [], []

        # 1. Lip metrics for AU12 (Smile) and AU15 (Depression)
        lip_left = landmarks.get("lip_left", (0.42, 0.65))
        lip_right = landmarks.get("lip_right", (0.58, 0.65))
        lip_top = landmarks.get("lip_top", (0.50, 0.62))
        lip_bottom = landmarks.get("lip_bottom", (0.50, 0.70))
        nose_tip = landmarks.get("nose_tip", (0.50, 0.52))

        # Mouth width vs vertical height
        mouth_width = math.hypot(lip_right[0] - lip_left[0], lip_right[1] - lip_left[1])
        mouth_height = math.hypot(lip_bottom[0] - lip_top[0], lip_bottom[1] - lip_top[1])
        
        # Mouth corner elevation relative to lip center
        lip_center_y = (lip_top[1] + lip_bottom[1]) / 2.0
        corner_avg_y = (lip_left[1] + lip_right[1]) / 2.0
        corner_elevation = lip_center_y - corner_avg_y

        # AU12 (Lip Corner Puller) intensity (0.0 to 5.0)
        # Wide corners pulled upward indicate strong smile
        smile_metric = max(0.0, (mouth_width - 0.14) * 20.0 + corner_elevation * 30.0)
        au12_intensity = round(min(5.0, max(0.0, smile_metric)), 2)

        # AU15 (Lip Corner Depressor)
        # Corners drooped below lip center indicate sadness/frown
        frown_metric = max(0.0, (corner_avg_y - lip_center_y) * 45.0)
        au15_intensity = round(min(5.0, max(0.0, frown_metric)), 2)

        # 2. Eye & Cheek metrics for AU06 (Cheek Raiser) & AU07 (Lid Tightener)
        eye_l_top = landmarks.get("eye_left_top", (0.40, 0.42))
        eye_l_bot = landmarks.get("eye_left_bottom", (0.40, 0.45))
        eye_r_top = landmarks.get("eye_right_top", (0.60, 0.42))
        eye_r_bot = landmarks.get("eye_right_bottom", (0.60, 0.45))

        left_eye_aperture = abs(eye_l_bot[1] - eye_l_top[1])
        right_eye_aperture = abs(eye_r_bot[1] - eye_r_top[1])
        mean_aperture = (left_eye_aperture + right_eye_aperture) / 2.0

        # High AU12 with eye squinting indicates genuine AU06 Duchenne smile
        au06_metric = max(0.0, (au12_intensity * 0.6) + max(0.0, (0.04 - mean_aperture) * 60.0))
        au06_intensity = round(min(5.0, max(0.0, au06_metric)), 2)

        # AU07 (Lid Tightener / stress) without AU12
        au07_metric = max(0.0, max(0.0, (0.035 - mean_aperture) * 80.0) - (au12_intensity * 0.4))
        au07_intensity = round(min(5.0, max(0.0, au07_metric)), 2)

        # 3. Eyebrow metrics for AU04 (Brow Lowerer) and AU01 (Inner Brow Raiser)
        brow_l_in = landmarks.get("brow_left_inner", (0.44, 0.38))
        brow_r_in = landmarks.get("brow_right_inner", (0.56, 0.38))
        inter_brow_dist = math.hypot(brow_r_in[0] - brow_l_in[0], brow_r_in[1] - brow_l_in[1])
        brow_nose_dist = ((brow_l_in[1] + brow_r_in[1]) / 2.0) - nose_tip[1]

        # AU04: Corrugator contraction pulls brows closer together and lower towards nose
        # Normal relaxed distance ~0.12; contraction drops to 0.08-0.09
        brow_lower_metric = max(0.0, (0.125 - inter_brow_dist) * 50.0 + (brow_nose_dist + 0.15) * 20.0)
        au04_intensity = round(min(5.0, max(0.0, brow_lower_metric)), 2)

        # AU01: Inner brow raising (medial frontalis) creates oblique brow posture (worry/distress)
        brow_l_mid = landmarks.get("brow_left_mid", (0.38, 0.35))
        inner_raise = (brow_l_mid[1] - brow_l_in[1])
        au01_metric = max(0.0, inner_raise * 60.0)
        au01_intensity = round(min(5.0, max(0.0, au01_metric)), 2)

        # Construct ActionUnit objects
        action_units = [
            ActionUnit(au="AU04", intensity=au04_intensity, present=au04_intensity >= self.presence_threshold),
            ActionUnit(au="AU06", intensity=au06_intensity, present=au06_intensity >= self.presence_threshold),
            ActionUnit(au="AU12", intensity=au12_intensity, present=au12_intensity >= self.presence_threshold),
            ActionUnit(au="AU15", intensity=au15_intensity, present=au15_intensity >= self.presence_threshold),
            ActionUnit(au="AU01", intensity=au01_intensity, present=au01_intensity >= self.presence_threshold),
            ActionUnit(au="AU07", intensity=au07_intensity, present=au07_intensity >= self.presence_threshold),
        ]

        # Clinical Distress Indicators identification
        indicators = []
        if au12_intensity < 0.6:
            indicators.append("reduced_smiling")
        if au04_intensity >= 1.5:
            indicators.append("brow_lowering")
        if au15_intensity >= 1.2:
            indicators.append("lip_corner_depression")
        if au07_intensity >= 1.8 and au12_intensity < 1.0:
            indicators.append("sustained_facial_tension")
        if au01_intensity >= 1.5 and au04_intensity >= 1.2:
            indicators.append("worry_complex_brows")
        if au12_intensity < 0.5 and au04_intensity < 0.8 and au06_intensity < 0.5:
            indicators.append("flat_affect")

        return action_units, indicators
