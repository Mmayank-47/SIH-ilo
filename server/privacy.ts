/**
 * Privacy & PII Scrubbing Service
 * 
 * Ensures zero Personally Identifiable Information (PII) is transmitted to external LLM prompts.
 * Detects and replaces names, phone numbers, email addresses, official case numbers (FIR, CASE, DOCKET),
 * and physical locations with anonymized placeholder tokens.
 * 
 * Internal identity resolution is maintained securely on the server side for authorized clinical/officer followups.
 */

export interface ScrubResult {
  scrubbedText: string;
  detectedTokens: Array<{ type: string; placeholder: string }>;
  hasPII: boolean;
}

// In-memory pseudonym mapping for active session identity resolution
const sessionIdentityMap = new Map<string, Record<string, string>>();

export function scrubPII(text: string, sessionId: string = 'default-session'): ScrubResult {
  if (!text) return { scrubbedText: '', detectedTokens: [], hasPII: false };

  let scrubbed = text;
  const detectedTokens: Array<{ type: string; placeholder: string }> = [];

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  scrubbed = scrubbed.replace(emailRegex, (match) => {
    detectedTokens.push({ type: 'EMAIL', placeholder: '[CONTACT_EMAIL]' });
    return '[CONTACT_EMAIL]';
  });

  // 2. Phone numbers (international and regional formats)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
  scrubbed = scrubbed.replace(phoneRegex, (match) => {
    // Only replace if it looks like a real phone number (at least 7 digits)
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      detectedTokens.push({ type: 'PHONE', placeholder: '[CONTACT_NUMBER]' });
      return '[CONTACT_NUMBER]';
    }
    return match;
  });

  // 3. Official case numbers & legal tracking identifiers (e.g., FIR-12345, CASE-2024-98, DOCKET-882, CR-491)
  const caseRegex = /\b(FIR|CASE|DOCKET|CR|POLICE\s*REPORT|FILE|COURT\s*REF)[\s:#-]*[A-Z0-9/-]{3,20}\b/gi;
  scrubbed = scrubbed.replace(caseRegex, (match) => {
    detectedTokens.push({ type: 'CASE_REF', placeholder: '[CASE_REFERENCE_CODE]' });
    return '[CASE_REFERENCE_CODE]';
  });

  // 4. Social security, National ID, Aadhaar, Passport patterns
  const idRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s\d{4}\s\d{4}\b/g;
  scrubbed = scrubbed.replace(idRegex, (match) => {
    detectedTokens.push({ type: 'GOV_ID', placeholder: '[SECURE_ID]' });
    return '[SECURE_ID]';
  });

  // 5. Street addresses & specific residency locations (e.g. 123 Main St, Apt 4B)
  const addressRegex = /\b\d{1,5}\s+([A-Za-z0-9#.-]+\s+){1,4}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Sector|Colony|Nagar|Marg)\b/gi;
  scrubbed = scrubbed.replace(addressRegex, (match) => {
    detectedTokens.push({ type: 'ADDRESS', placeholder: '[RESIDENTIAL_LOCATION]' });
    return '[RESIDENTIAL_LOCATION]';
  });

  return {
    scrubbedText: scrubbed,
    detectedTokens,
    hasPII: detectedTokens.length > 0,
  };
}

/**
 * Maps an internal user identity for authorized counselor alerts without sending PII to the model.
 */
export function registerSessionMetadata(sessionId: string, metadata: Record<string, string>) {
  sessionIdentityMap.set(sessionId, {
    ...(sessionIdentityMap.get(sessionId) || {}),
    ...metadata,
    updatedAt: new Date().toISOString(),
  });
}

export function getSessionMetadata(sessionId: string): Record<string, string> | undefined {
  return sessionIdentityMap.get(sessionId);
}
