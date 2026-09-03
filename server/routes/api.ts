/**
 * Express REST API Routes for Gemini AI Mental Health & Distress Monitoring Platform
 */

import { Router, Request, Response } from 'express';
import {
  handleCompanionMessage,
  analyzeVoiceSignal,
  analyzeImageSignal,
  analyzeJournalSignal,
  computeDynamicDistressScore,
  alertStore,
  AlertRecord,
  PRIMARY_MODEL,
} from '../geminiService.js';
import { scrubPII, registerSessionMetadata } from '../privacy.js';

export const apiRouter = Router();

// 1. Health & Configuration Verification
apiRouter.get('/health', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    service: 'ilo - AI Trauma-Informed Mental Health Monitoring & Distress Prediction Platform',
    geminiConfigured: hasKey,
    activeModel: PRIMARY_MODEL,
    features: [
      'Conversational AI Companion Layer (ilo)',
      'Multimodal Voice & Audio Signal Analysis',
      'Multimodal Image & Expressive Art Analysis',
      'Linguistic & Journal Reflection Analysis',
      'Dynamic Distress Score (DDS) Risk Engine',
      'Automated Function-Calling Alert Triggers',
      'Zero-PII Privacy & Client-Side Pseudonymization',
    ],
    timestamp: new Date().toISOString(),
  });
});

// 2. POST /api/chat/message - Conversational Mascot Turn with Memory & Function Calling
apiRouter.post('/chat/message', async (req: Request, res: Response) => {
  try {
    const { sessionId = 'session-default', message, contextNotes, userMeta } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Field "message" (string) is required.' });
    }

    if (userMeta && typeof userMeta === 'object') {
      registerSessionMetadata(sessionId, userMeta);
    }

    const result = await handleCompanionMessage({
      sessionId,
      message,
      contextNotes,
    });

    res.json({
      success: true,
      sessionId,
      reply: result.reply,
      actionsTriggered: result.actionsTriggered,
      isCrisisAlert: result.isCrisisAlert,
      scrubInfo: {
        hasPII: result.scrubResult.hasPII,
        tokensDetectedCount: result.scrubResult.detectedTokens.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /chat/message] Error:', error);
    res.status(500).json({
      error: 'Failed to generate companion response',
      details: error?.message,
    });
  }
});

// 3. POST /api/analyze/voice - Multimodal Voice & Audio Analysis
apiRouter.post('/analyze/voice', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', durationSeconds, transcriptText } = req.body;

    if (!audioBase64 && !transcriptText) {
      return res.status(400).json({
        error: 'Either "audioBase64" or "transcriptText" is required for voice analysis.',
      });
    }

    const analysis = await analyzeVoiceSignal({
      audioBase64,
      mimeType,
      durationSeconds,
      transcriptText,
    });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /analyze/voice] Error:', error);
    res.status(500).json({
      error: 'Voice analysis failed',
      details: error?.message,
    });
  }
});

// 4. POST /api/analyze/image - Multimodal Image & Expressive Art Analysis
apiRouter.post('/analyze/image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', contextText } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Field "imageBase64" is required.' });
    }

    const analysis = await analyzeImageSignal({
      imageBase64,
      mimeType,
      contextText,
    });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /analyze/image] Error:', error);
    res.status(500).json({
      error: 'Image analysis failed',
      details: error?.message,
    });
  }
});

// 5. POST /api/analyze/journal - Deep Journal & Linguistic Analysis
apiRouter.post('/api/analyze/journal', async (req: Request, res: Response) => {
  try {
    const { title, content, tag } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Field "content" (string) is required.' });
    }

    const analysis = await analyzeJournalSignal({ title, content, tag });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /analyze/journal] Error:', error);
    res.status(500).json({
      error: 'Journal analysis failed',
      details: error?.message,
    });
  }
});

// Also support without double /api prefix just in case:
apiRouter.post('/analyze/journal', async (req: Request, res: Response) => {
  try {
    const { title, content, tag } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Field "content" (string) is required.' });
    }

    const analysis = await analyzeJournalSignal({ title, content, tag });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /analyze/journal] Error:', error);
    res.status(500).json({
      error: 'Journal analysis failed',
      details: error?.message,
    });
  }
});

// 6. POST /api/score/compute - Dynamic Distress Score (DDS) Risk Engine
apiRouter.post('/score/compute', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      recentChatSummary,
      recentJournalSummary,
      voiceDistressScore,
      imageDistressScore,
      somaticSelfReport,
      historicalScores,
    } = req.body;

    const ddsResult = await computeDynamicDistressScore({
      sessionId,
      recentChatSummary,
      recentJournalSummary,
      voiceDistressScore,
      imageDistressScore,
      somaticSelfReport,
      historicalScores,
    });

    res.json({
      success: true,
      dds: ddsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /score/compute] Error:', error);
    res.status(500).json({
      error: 'Failed to compute Dynamic Distress Score',
      details: error?.message,
    });
  }
});

// 7. POST /api/alerts/trigger - Manual or automated trigger for counsellor alert / protection officer
apiRouter.post('/alerts/trigger', (req: Request, res: Response) => {
  try {
    const {
      sessionId = 'session-manual',
      type = 'counsellor_alert',
      priority = 'medium',
      distressLevel = 50,
      summary,
      details = {},
    } = req.body;

    if (!summary) {
      return res.status(400).json({ error: 'Field "summary" is required.' });
    }

    const scrubbed = scrubPII(summary);

    const newRecord: AlertRecord = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      type,
      priority,
      distressLevel: Number(distressLevel),
      summary: scrubbed.scrubbedText,
      details,
      status: 'active',
    };

    alertStore.unshift(newRecord);

    res.status(201).json({
      success: true,
      alert: newRecord,
      totalActiveAlerts: alertStore.filter((a) => a.status === 'active').length,
    });
  } catch (error: any) {
    console.error('[API /alerts/trigger] Error:', error);
    res.status(500).json({ error: 'Failed to record alert' });
  }
});

// 8. GET /api/alerts/history - View Logged Alerts for Auditing & Clinical Oversight
apiRouter.get('/alerts/history', (req: Request, res: Response) => {
  const { priority, status, limit = 50 } = req.query;

  let filtered = [...alertStore];
  if (priority && typeof priority === 'string') {
    filtered = filtered.filter((a) => a.priority === priority);
  }
  if (status && typeof status === 'string') {
    filtered = filtered.filter((a) => a.status === status);
  }

  res.json({
    total: alertStore.length,
    returned: filtered.slice(0, Number(limit)).length,
    alerts: filtered.slice(0, Number(limit)),
  });
});

// 9. PATCH /api/alerts/:id/status - Update Alert Status (e.g. acknowledge or resolve)
apiRouter.patch('/alerts/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const record = alertStore.find((a) => a.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (status && ['active', 'acknowledged', 'resolved'].includes(status)) {
    record.status = status;
  }

  res.json({ success: true, alert: record });
});

// 10. POST /api/privacy/scrub-test - Privacy & PII scrubbing verification utility
apiRouter.post('/privacy/scrub-test', (req: Request, res: Response) => {
  const { text = '' } = req.body;
  const scrubResult = scrubPII(text);
  res.json({
    originalLength: text.length,
    scrubResult,
  });
});
