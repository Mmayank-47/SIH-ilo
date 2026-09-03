import React, { useState, useEffect } from 'react';
import { DynamicDistressScore, AlertRecord } from '../types';

interface ClinicalMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToActivities?: () => void;
}

type MonitorTab = 'dds' | 'mascot' | 'multimodal' | 'alerts' | 'privacy';

export const ClinicalMonitorModal: React.FC<ClinicalMonitorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('dds');
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    activeModel: string;
    geminiConfigured: boolean;
  } | null>(null);

  // DDS State
  const [ddsData, setDdsData] = useState<DynamicDistressScore | null>(null);
  const [isComputingDDS, setIsComputingDDS] = useState(false);
  const [ddsChatSummary, setDdsChatSummary] = useState(
    'User reported acute chest tightness and sensory sensitivity to sudden loud street traffic; requested quiet presence.'
  );
  const [tensionRating, setTensionRating] = useState(7);
  const [sleepHours, setSleepHours] = useState(4.5);
  const [heartRacing, setHeartRacing] = useState(true);

  // Alerts State
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Multimodal State
  const [voiceSampleType, setVoiceSampleType] = useState('hesitant_trauma');
  const [voiceTranscript, setVoiceTranscript] = useState(
    'I... I could not sleep last night. Every time a car sped past, my heart began pounding against my ribs. I felt frozen in bed.'
  );
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  const [imageSampleType, setImageSampleType] = useState('mood_sketch');
  const [imageContext, setImageContext] = useState(
    'Drawing of dark dense brambles enclosing a tiny soft ember at the center.'
  );
  const [imageResult, setImageResult] = useState<any>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Privacy Scrubbing State
  const [samplePiiText, setSamplePiiText] = useState(
    'My name is Sunita Sharma, phone 98765-43210. Under FIR-2024-8834 at Sector 14 Police Station, I have court hearing on Friday. Email me at sunita.s@example.org.'
  );
  const [scrubResult, setScrubResult] = useState<any>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Mascot Sandbox
  const [mascotInput, setMascotInput] = useState('I feel like loud noises will never let me feel safe again.');
  const [mascotReply, setMascotReply] = useState<string | null>(null);
  const [mascotActions, setMascotActions] = useState<any[]>([]);
  const [isMascotThinking, setIsMascotThinking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch Health
    fetch('/api/health')
      .then((r) => r.json())
      .then(setBackendHealth)
      .catch(() => {});

    // Fetch Alerts
    fetchAlerts();

    // Initial DDS computation if null
    if (!ddsData) {
      runComputeDDS();
    }
  }, [isOpen]);

  const fetchAlerts = async () => {
    setIsLoadingAlerts(true);
    try {
      const res = await fetch('/api/alerts/history');
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const runComputeDDS = async () => {
    setIsComputingDDS(true);
    try {
      const res = await fetch('/api/score/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentChatSummary: ddsChatSummary,
          somaticSelfReport: {
            tension: tensionRating,
            sleepHours,
            heartRacing,
            appetiteDisruption: true,
          },
          historicalScores: [32, 44, 58],
        }),
      });
      const data = await res.json();
      if (data.score) setDdsData(data.score);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputingDDS(false);
    }
  };

  const handleUpdateAlertStatus = async (id: string, newStatus: 'active' | 'acknowledged' | 'resolved') => {
    try {
      const res = await fetch(`/api/alerts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.record) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? data.record : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTestAlert = async (priority: 'medium' | 'high' | 'critical') => {
    try {
      const res = await fetch('/api/alerts/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: priority === 'critical' ? 'protection_escalation' : 'counsellor_alert',
          priority,
          distressLevel: priority === 'critical' ? 92 : priority === 'high' ? 76 : 58,
          summary: `Manual clinical priority flag (${priority.toUpperCase()}) initiated by staff review.`,
          details: { reason: 'Staff clinical observation of elevated somatic distress' },
        }),
      });
      const data = await res.json();
      if (data.record) {
        setAlerts((prev) => [data.record, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeVoice = async () => {
    setIsAnalyzingVoice(true);
    setVoiceResult(null);
    try {
      const res = await fetch('/api/analyze/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: voiceTranscript,
          sampleType: voiceSampleType,
        }),
      });
      const data = await res.json();
      setVoiceResult(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleAnalyzeImage = async () => {
    setIsAnalyzingImage(true);
    setImageResult(null);
    try {
      // 1x1 base64 transparent gif placeholder for safe multimodal demonstration
      const dummyImage =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzH4p+cQAAAABJRU5ErkJggg==';
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dummyImage,
          contextText: imageContext,
        }),
      });
      const data = await res.json();
      setImageResult(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleTestPiiScrub = async () => {
    setIsScrubbing(true);
    try {
      const res = await fetch('/api/privacy/scrub-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: samplePiiText }),
      });
      const data = await res.json();
      setScrubResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleTestMascot = async () => {
    if (!mascotInput.trim()) return;
    setIsMascotThinking(true);
    setMascotReply(null);
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'monitor-test-session',
          message: mascotInput,
        }),
      });
      const data = await res.json();
      setMascotReply(data.reply);
      setMascotActions(data.actionsTriggered || []);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsMascotThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#D5CEBF] flex flex-col max-h-[92vh] overflow-hidden text-[#2C2824]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E3DCCF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6E775C] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-[18px] font-bold text-[#2C2824]">
                  Clinical Distress Monitor & AI Diagnostics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6E775C]/15 text-[#6E775C] border border-[#6E775C]/30">
                  {backendHealth?.activeModel || 'Gemini Active'}
                </span>
              </div>
              <p className="text-xs text-[#7A7067]">
                Non-clinical risk stratification, trauma-informed mascot memory & zero-PII protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F2EDE2] text-[#7A7067] hover:text-[#2C2824] hover:bg-[#E8E2D5] flex items-center justify-center transition-colors"
            aria-label="Close monitor"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-[#F6F2E9] border-b border-[#E3DCCF] overflow-x-auto no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dds')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'dds'
                ? 'bg-white text-[#2C2824] shadow-xs border border-[#D5CEBF]'
                : 'text-[#6E775C] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">speed</span>
            <span>Distress Risk Engine (DDS)</span>
          </button>

          <button
            onClick={() => setActiveTab('mascot')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'mascot'
                ? 'bg-white text-[#2C2824] shadow-xs border border-[#D5CEBF]'
                : 'text-[#6E775C] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span>Mascot & Tools</span>
          </button>

          <button
            onClick={() => setActiveTab('multimodal')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'multimodal'
                ? 'bg-white text-[#2C2824] shadow-xs border border-[#D5CEBF]'
                : 'text-[#6E775C] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">perm_media</span>
            <span>Multimodal Signal Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-white text-[#2C2824] shadow-xs border border-[#D5CEBF]'
                : 'text-[#6E775C] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            <span>Safety Alerts ({alerts.filter((a) => a.status === 'active').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-white text-[#2C2824] shadow-xs border border-[#D5CEBF]'
                : 'text-[#6E775C] hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Zero-PII Shield</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DYNAMIC DISTRESS SCORE */}
          {activeTab === 'dds' && (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Gauge Card */}
                <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A7067] uppercase tracking-wider">
                      Overall Distress Score
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        ddsData?.riskTier === 'Severe/Crisis'
                          ? 'bg-[#C44D4D]/15 text-[#C44D4D]'
                          : ddsData?.riskTier === 'Elevated'
                          ? 'bg-[#D97736]/15 text-[#D97736]'
                          : ddsData?.riskTier === 'Moderate'
                          ? 'bg-[#C47A5C]/15 text-[#C47A5C]'
                          : 'bg-[#6E775C]/15 text-[#6E775C]'
                      }`}
                    >
                      {ddsData?.riskTier || 'Moderate'} Tier
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 my-3">
                    <span className="font-serif text-5xl font-bold text-[#2C2824]">
                      {ddsData?.overallDDS ?? 48}
                    </span>
                    <span className="text-sm font-medium text-[#7A7067]">/ 100</span>
                  </div>

                  <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        (ddsData?.overallDDS ?? 48) > 80
                          ? 'bg-[#C44D4D]'
                          : (ddsData?.overallDDS ?? 48) > 60
                          ? 'bg-[#D97736]'
                          : (ddsData?.overallDDS ?? 48) > 30
                          ? 'bg-[#C47A5C]'
                          : 'bg-[#6E775C]'
                      }`}
                      style={{ width: `${ddsData?.overallDDS ?? 48}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#7A7067] mt-3">
                    <span>Trend: <strong className="text-[#2C2824] capitalize">{ddsData?.longitudinalTrend || 'stable'}</strong></span>
                    <span>Action: <strong className="text-[#C47A5C]">{ddsData?.recommendedInterventionTier?.replace(/_/g, ' ') || 'counsellor checkin'}</strong></span>
                  </div>
                </div>

                {/* Subscores Card */}
                <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs md:col-span-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#7A7067] uppercase tracking-wider">
                      Domain Subscores Breakdown
                    </span>
                    <span className="text-xs text-[#6E775C]">Weighted Multi-Signal Synthesis</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#56524D] font-medium">Emotional Distress</span>
                        <span className="font-bold text-[#2C2824]">
                          {ddsData?.subscores?.emotionalDistress ?? 52}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE2D5] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#C47A5C] h-full rounded-full"
                          style={{ width: `${ddsData?.subscores?.emotionalDistress ?? 52}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#56524D] font-medium">Cognitive Disruption</span>
                        <span className="font-bold text-[#2C2824]">
                          {ddsData?.subscores?.cognitiveDisruption ?? 44}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE2D5] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#55708C] h-full rounded-full"
                          style={{ width: `${ddsData?.subscores?.cognitiveDisruption ?? 44}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#56524D] font-medium">Somatic Indicators</span>
                        <span className="font-bold text-[#2C2824]">
                          {ddsData?.subscores?.somaticIndicators ?? 60}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE2D5] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#D97736] h-full rounded-full"
                          style={{ width: `${ddsData?.subscores?.somaticIndicators ?? 60}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#56524D] font-medium">Behavioral Withdrawal</span>
                        <span className="font-bold text-[#2C2824]">
                          {ddsData?.subscores?.behavioralWithdrawal ?? 38}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE2D5] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#6E775C] h-full rounded-full"
                          style={{ width: `${ddsData?.subscores?.behavioralWithdrawal ?? 38}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DED4] text-xs text-[#56524D] leading-relaxed">
                    <strong className="text-[#2C2824]">Clinical Narrative: </strong>
                    {ddsData?.nonClinicalSummary ||
                      'Elevated stress noted in somatic arousal (chest tightness, startle reaction). Responsive to paced grounding.'}
                  </div>
                </div>
              </div>

              {/* Protective Factors & Recommended Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs">
                  <h4 className="text-xs font-semibold text-[#6E775C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    Protective & Resilience Factors
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#56524D]">
                    {(ddsData?.protectiveFactors || [
                      'Active engagement with gentle sanctuary companion',
                      'Awareness of somatic arousal cues',
                      'Receptive to paced breathing',
                    ]).map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#6E775C] font-bold">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs">
                  <h4 className="text-xs font-semibold text-[#C47A5C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    Suggested Interventions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#56524D]">
                    {(ddsData?.suggestedActions || [
                      'Prompt evening soundscape with low acoustic frequencies',
                      'Schedule gentle morning check-in',
                      'Provide warm supportive space without interrogation',
                    ]).map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#C47A5C] font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Live Signal Parameter Simulator */}
              <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-[15px] font-bold text-[#2C2824]">
                    Simulate Signal Inputs & Recompute DDS
                  </h3>
                  <button
                    onClick={runComputeDDS}
                    disabled={isComputingDDS}
                    className="px-4 py-1.5 rounded-full bg-[#6E775C] text-white text-xs font-semibold hover:bg-[#5A634A] disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    {isComputingDDS ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Run DDS Prediction</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#7A7067] mb-1">
                    Recent Context / Chat Extraction (PII-Scrubbed)
                  </label>
                  <textarea
                    rows={2}
                    value={ddsChatSummary}
                    onChange={(e) => setDdsChatSummary(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5CEBF] text-xs focus:ring-1 focus:ring-[#6E775C] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#7A7067] mb-1">
                      Self-Reported Tension: {tensionRating} / 10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={tensionRating}
                      onChange={(e) => setTensionRating(Number(e.target.value))}
                      className="w-full accent-[#6E775C]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#7A7067] mb-1">
                      Last Night's Sleep: {sleepHours} hrs
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full accent-[#6E775C]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="hr-racing"
                      checked={heartRacing}
                      onChange={(e) => setHeartRacing(e.target.checked)}
                      className="rounded accent-[#C47A5C] w-4 h-4"
                    />
                    <label htmlFor="hr-racing" className="font-medium text-[#2C2824]">
                      Heart Racing / Tremor Reported
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASCOT CONVERSATIONAL MEMORY & FUNCTION-CALLING */}
          {activeTab === 'mascot' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F6F2E9] border border-[#E3DCCF] text-xs text-[#56524D] leading-relaxed">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-[#2C2824]">
                  <span className="material-symbols-outlined text-[18px] text-[#6E775C]">psychology</span>
                  Trauma-Informed Mascot System Constraints
                </div>
                <p>
                  • <strong>Warm Companion Persona:</strong> Never diagnostic, never clinical, holding steady presence.<br />
                  • <strong>Strict Non-Interrogation Rule:</strong> Never references court dates, police FIRs, or legal status directly.<br />
                  • <strong>Automated Function-Calling Triggers:</strong> Autonomously fires <code>trigger_counsellor_alert</code>, <code>schedule_followup</code>, or <code>recommend_activity</code> based on nuanced psychological cues.
                </p>
              </div>

              {/* Live Mascot Dialog Playground */}
              <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs space-y-4">
                <h3 className="font-serif text-[15px] font-bold text-[#2C2824]">
                  Test Live Mascot & Autonomous Function Calling
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mascotInput}
                    onChange={(e) => setMascotInput(e.target.value)}
                    placeholder="Enter distress statement..."
                    className="flex-1 p-3 rounded-xl border border-[#D5CEBF] text-xs outline-none focus:ring-2 focus:ring-[#C47A5C]/40"
                  />
                  <button
                    onClick={handleTestMascot}
                    disabled={isMascotThinking}
                    className="px-5 py-2.5 rounded-xl bg-[#C47A5C] text-white text-xs font-semibold hover:bg-[#B36C4F] disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    {isMascotThinking ? 'Calling Gemini...' : 'Send to ilo'}
                  </button>
                </div>

                {/* Quick Test Cues */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="text-[#7A7067] self-center">Try test prompts:</span>
                  <button
                    onClick={() => setMascotInput('I feel a heavy knot in my chest and my hands will not stop trembling.')}
                    className="px-2.5 py-1 rounded-full bg-[#F2EDE2] text-[#2C2824] hover:bg-[#EAE2D5]"
                  >
                    Somatic Tremor
                  </button>
                  <button
                    onClick={() => setMascotInput('I feel completely hopeless today. I don\'t know if I can keep going.')}
                    className="px-2.5 py-1 rounded-full bg-[#C44D4D]/10 text-[#C44D4D] hover:bg-[#C44D4D]/20 font-semibold"
                  >
                    Crisis Trigger
                  </button>
                  <button
                    onClick={() => setMascotInput('Can you recommend a soothing soundscape or breath exercise?')}
                    className="px-2.5 py-1 rounded-full bg-[#6E775C]/15 text-[#6E775C] hover:bg-[#6E775C]/25"
                  >
                    Activity Request
                  </button>
                </div>

                {mascotReply && (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#A7B59C]/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#6E775C]">spa</span>
                      <span className="text-xs font-bold text-[#2C2824]">ilo's Generated Response:</span>
                    </div>
                    <p className="text-xs text-[#2C2824] leading-relaxed italic">"{mascotReply}"</p>

                    {mascotActions.length > 0 && (
                      <div className="pt-2 border-t border-[#E3DCCF]">
                        <span className="text-[11px] font-bold text-[#C47A5C] uppercase tracking-wider block mb-1">
                          Tools Triggered Autonomously by Gemini:
                        </span>
                        <div className="space-y-1">
                          {mascotActions.map((act, i) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#D5CEBF] text-[11px] flex items-center justify-between"
                            >
                              <span className="font-mono text-[#6E775C] font-semibold">{act.tool}</span>
                              <span className="text-[#7A7067]">{act.record?.summary || 'Executed successfully'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MULTIMODAL SIGNAL LAB */}
          {activeTab === 'multimodal' && (
            <div className="space-y-6">
              {/* Voice Signal Analysis */}
              <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#6E775C]/15 text-[#6E775C] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-[#2C2824]">
                        Voice & Acoustic Sentiment Analysis
                      </h4>
                      <p className="text-[11px] text-[#7A7067]">
                        Evaluates speech rate, vocal tremor, pauses, and affective state
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeVoice}
                    disabled={isAnalyzingVoice}
                    className="px-4 py-1.5 rounded-full bg-[#6E775C] text-white text-xs font-semibold hover:bg-[#5A634A] disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    {isAnalyzingVoice ? 'Analyzing Audio...' : 'Analyze Voice Signal'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#7A7067] mb-1">
                    Voice Note Transcript / Acoustic Context
                  </label>
                  <textarea
                    rows={2}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5CEBF] text-xs outline-none focus:ring-1 focus:ring-[#6E775C]"
                  />
                </div>

                {voiceResult && (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D5CEBF] text-xs space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Speech Rate</span>
                        <strong className="text-[#2C2824] capitalize">{voiceResult.speechRate}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Vocal Strain</span>
                        <strong className="text-[#C47A5C]">{voiceResult.distressLevel} / 100</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Affective State</span>
                        <strong className="text-[#2C2824]">{voiceResult.affectiveState}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Clinical Flag</span>
                        <strong className={voiceResult.clinicalRiskFlag ? 'text-[#C44D4D]' : 'text-[#6E775C]'}>
                          {voiceResult.clinicalRiskFlag ? 'Elevated' : 'Normal'}
                        </strong>
                      </div>
                    </div>
                    <p className="text-[#56524D] leading-relaxed">
                      <strong>Summary: </strong>{voiceResult.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Expressive Art & Visual Sentiment */}
              <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#C47A5C]/15 text-[#C47A5C] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">palette</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-[#2C2824]">
                        Expressive Art & Visual Mood Analysis
                      </h4>
                      <p className="text-[11px] text-[#7A7067]">
                        Non-clinical visual sentiment of artwork, drawings, and somatic line tension
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzingImage}
                    className="px-4 py-1.5 rounded-full bg-[#C47A5C] text-white text-xs font-semibold hover:bg-[#B36C4F] disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    {isAnalyzingImage ? 'Analyzing Image...' : 'Analyze Artwork'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#7A7067] mb-1">
                    Art Notes / User Context
                  </label>
                  <input
                    type="text"
                    value={imageContext}
                    onChange={(e) => setImageContext(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5CEBF] text-xs outline-none focus:ring-1 focus:ring-[#C47A5C]"
                  />
                </div>

                {imageResult && (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D5CEBF] text-xs space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Tension Level</span>
                        <strong className="text-[#C47A5C]">{imageResult.tensionLevel} / 100</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Dominant Tone</span>
                        <strong className="text-[#2C2824]">{imageResult.dominantColorTone}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5DED4]">
                        <span className="text-[10px] text-[#7A7067] block">Valence</span>
                        <strong className="text-[#6E775C]">{imageResult.emotionalValence}</strong>
                      </div>
                    </div>
                    <p className="text-[#56524D] leading-relaxed">
                      <strong>Trauma-Informed Interpretation: </strong>{imageResult.expressiveInterpretation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAFETY ALERTS LOG & DISPATCH */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-[16px] font-bold text-[#2C2824]">
                    Active Counselor Alerts & Interventions
                  </h3>
                  <p className="text-xs text-[#7A7067]">
                    Dispatched automatically by companion function-calling or manual escalation
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTriggerTestAlert('medium')}
                    className="px-3 py-1 rounded-full bg-[#F2EDE2] text-[#C47A5C] text-xs font-semibold hover:bg-[#E8DFD0]"
                  >
                    + Test Medium Alert
                  </button>
                  <button
                    onClick={() => handleTriggerTestAlert('critical')}
                    className="px-3 py-1 rounded-full bg-[#C44D4D]/15 text-[#C44D4D] text-xs font-semibold hover:bg-[#C44D4D]/25"
                  >
                    + Test Critical Escalation
                  </button>
                </div>
              </div>

              {isLoadingAlerts ? (
                <div className="p-8 text-center text-xs text-[#7A7067]">Loading alerts log...</div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7A7067] bg-white rounded-2xl border border-[#D5CEBF]">
                  No alerts currently logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border shadow-xs transition-all ${
                        alert.status === 'resolved'
                          ? 'bg-white/60 border-[#D5CEBF]/60 opacity-70'
                          : alert.priority === 'critical'
                          ? 'bg-[#FFF5F5] border-[#C44D4D]/40'
                          : 'bg-white border-[#D5CEBF]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              alert.priority === 'critical'
                                ? 'bg-[#C44D4D] text-white'
                                : alert.priority === 'high'
                                ? 'bg-[#D97736] text-white'
                                : alert.priority === 'medium'
                                ? 'bg-[#C47A5C] text-white'
                                : 'bg-[#6E775C] text-white'
                            }`}
                          >
                            {alert.priority}
                          </span>
                          <span className="text-xs font-bold text-[#2C2824] capitalize">
                            {alert.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-[#8D887E]">
                            • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, 'active')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              alert.status === 'active' ? 'bg-[#C47A5C] text-white' : 'text-[#7A7067] hover:bg-[#F2EDE2]'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, 'acknowledged')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              alert.status === 'acknowledged' ? 'bg-[#6E775C] text-white' : 'text-[#7A7067] hover:bg-[#F2EDE2]'
                            }`}
                          >
                            Ack
                          </button>
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, 'resolved')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              alert.status === 'resolved' ? 'bg-[#4A7252] text-white' : 'text-[#7A7067] hover:bg-[#F2EDE2]'
                            }`}
                          >
                            Resolved
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#2C2824] mb-1 font-medium">{alert.summary}</p>
                      {alert.details && (
                        <div className="text-[11px] text-[#7A7067] bg-[#FAF7F2] p-2 rounded-lg border border-[#E5DED4]">
                          <code>{JSON.stringify(alert.details)}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ZERO-PII PRIVACY SHIELD */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F6F2E9] border border-[#E3DCCF] text-xs text-[#56524D] leading-relaxed">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-[#2C2824]">
                  <span className="material-symbols-outlined text-[18px] text-[#6E775C]">verified_user</span>
                  Zero-PII Client Pseudonymization Protocol
                </div>
                <p>
                  Before any text, audio transcript, or journal reflection leaves the device, our regex + tokenization layer scrubs:
                  names, legal case numbers (e.g. <code>FIR-xxxx</code>, <code>CASE-xxxx</code>), phone numbers, street addresses, and emails.
                  The Gemini API only receives anonymized tokens (e.g. <code>[CASE_NO_1]</code>, <code>[PHONE_1]</code>).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#D5CEBF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-[15px] font-bold text-[#2C2824]">
                    Interactive PII Scrubbing Tester
                  </h4>
                  <button
                    onClick={handleTestPiiScrub}
                    disabled={isScrubbing}
                    className="px-4 py-1.5 rounded-full bg-[#6E775C] text-white text-xs font-semibold hover:bg-[#5A634A] disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    {isScrubbing ? 'Scrubbing...' : 'Run PII Filter'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#7A7067] mb-1">
                    Raw User Input with Sensitive Identifiers:
                  </label>
                  <textarea
                    rows={3}
                    value={samplePiiText}
                    onChange={(e) => setSamplePiiText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5CEBF] text-xs outline-none focus:ring-1 focus:ring-[#6E775C]"
                  />
                </div>

                {scrubResult && (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D5CEBF] text-xs space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6E775C] tracking-wider block mb-1">
                        Filtered Payload Sent to Gemini API:
                      </span>
                      <p className="p-3 bg-white rounded-lg border border-[#A7B59C]/40 text-[#2C2824] font-mono text-[11px] leading-relaxed">
                        {scrubResult.scrubbed}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C47A5C] tracking-wider block mb-1">
                        Detected & Protected Tokens ({scrubResult.detectedCount}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {scrubResult.tokens?.map((tok: any, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#D5CEBF] text-[10px] font-mono"
                          >
                            {tok.type}: <strong>{tok.token}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-[#E3DCCF] text-xs text-[#7A7067]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-pulse"></span>
            <span>ilo AI Monitoring Layer Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#F2EDE2] text-[#2C2824] hover:bg-[#EAE2D5] font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
