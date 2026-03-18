/**
 * Presale code extraction from text.
 * Identifies potential presale codes using patterns commonly seen
 * on Reddit, Twitter, forums, and fan sites.
 */

// Common presale code patterns:
// - All caps, 4-20 chars: "SPOTIFY2024", "MUSIC", "COVERT"
// - Mixed case with numbers: "Rock2024", "ChrisLake"
// - Codes often follow "code:", "code is", "use", "try", etc.

const CODE_CONTEXT_PATTERNS = [
  // "code: XXXXX" or "code is XXXXX" or "presale code: XXXXX"
  /(?:presale\s*)?code[\s:]+is?\s*[:\-]?\s*["']?([A-Z0-9][A-Z0-9\-_]{2,19})["']?/gi,
  // "use XXXXX" or "try XXXXX" at presale
  /(?:use|try|enter|type)\s+["']?([A-Z0-9][A-Z0-9\-_]{2,19})["']?/gi,
  // "XXXXX worked" or "XXXXX is the code"
  /["']?([A-Z][A-Z0-9\-_]{2,19})["']?\s+(?:worked|works|is\s+the\s+code|is\s+the\s+presale)/gi,
  // Markdown or quoted codes: `CODE` or "CODE"
  /[`"']([A-Z0-9][A-Z0-9\-_]{2,19})[`"']/g,
  // "password: XXXXX" or "pw: XXXXX"
  /(?:password|pw|pass)[\s:]+["']?([A-Z0-9][A-Z0-9\-_]{2,19})["']?/gi,
];

// Words that look like codes but aren't
const FALSE_POSITIVES = new Set([
  "THE", "AND", "FOR", "NOT", "BUT", "ARE", "WAS", "HAS", "HAD", "WILL",
  "CAN", "GET", "USE", "TRY", "GOT", "HIS", "HER", "HOW", "ANY", "ALL",
  "NEW", "NOW", "OLD", "OUT", "OUR", "TOP", "SET", "PUT", "SAY", "WAY",
  "WHO", "WHY", "BIG", "FAR", "FEW", "OWN", "SAW", "LET", "RAN", "TOO",
  "YES", "YET", "DAY", "DID", "END", "GOD", "MAY", "MAN", "JUST", "ALSO",
  "THEN", "THAT", "THIS", "THEM", "THEY", "BEEN", "HAVE", "FROM", "WITH",
  "WERE", "WHAT", "WHEN", "YOUR", "EACH", "MAKE", "LIKE", "LONG", "LOOK",
  "MANY", "MOST", "MUCH", "MUST", "NEED", "NEXT", "ONLY", "OVER", "SAME",
  "TAKE", "TELL", "THAN", "VERY", "WELL", "WORK", "YEAR", "BACK", "COME",
  "COULD", "FIRST", "FOUND", "GOING", "GREAT", "MIGHT", "NEVER", "STILL",
  "THINK", "THOSE", "UNDER", "WHERE", "WHICH", "WHILE", "WOULD", "AFTER",
  "AGAIN", "BEING", "COULD", "EVERY", "GIVEN", "MUSIC", "LIVE", "SHOW",
  "TICKET", "PRESALE", "ONSALE", "EVENT", "ARTIST", "CONCERT",
  "CODE", "ENTER", "ACCESS", "SIGNUP", "LOGIN", "REDDIT", "HTTPS", "HTTP",
  "EDIT", "UPDATE", "DELETED", "REMOVED", "NULL", "TRUE", "FALSE",
  "SOLD", "SALE", "FREE", "PRICE", "LINK", "CLICK", "HERE", "HELP",
  "THANKS", "THANK", "PLEASE", "SORRY", "VERIFIED", "CONFIRMED",
]);

// Known common presale code patterns that are almost always real codes
const KNOWN_CODE_PATTERNS = [
  /^(SPOTIFY|AMEX|LIVENATION|INSIDER|VENUE|VIP|FANCLUB|FANS?FIRST)\w*$/i,
  /^[A-Z]{2,8}\d{2,6}$/,  // e.g., "ROCK2024", "LN2025"
  /^\d{4,8}$/,              // Pure numeric codes like "1234"
];

export interface ExtractedCode {
  code: string;
  confidence: "high" | "medium" | "low";
  context: string; // surrounding text snippet
}

export function extractCodes(text: string): ExtractedCode[] {
  const found = new Map<string, ExtractedCode>();

  // First pass: contextual patterns (higher confidence)
  for (const pattern of CODE_CONTEXT_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1].toUpperCase().trim();
      if (isValidCode(code)) {
        const contextStart = Math.max(0, match.index - 30);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 30);
        const context = text.slice(contextStart, contextEnd).replace(/\n/g, " ").trim();

        const existing = found.get(code);
        if (!existing || existing.confidence !== "high") {
          found.set(code, {
            code,
            confidence: isKnownPattern(code) ? "high" : "medium",
            context,
          });
        }
      }
    }
  }

  // Second pass: standalone all-caps words (4-15 chars) that look like codes
  // Only if they appear in a presale-related context
  if (/presale|code|password|access/i.test(text)) {
    const standalonePattern = /\b([A-Z][A-Z0-9]{3,14})\b/g;
    let match;
    while ((match = standalonePattern.exec(text)) !== null) {
      const code = match[1].toUpperCase();
      if (!found.has(code) && isValidCode(code) && isKnownPattern(code)) {
        const contextStart = Math.max(0, match.index - 30);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 30);
        const context = text.slice(contextStart, contextEnd).replace(/\n/g, " ").trim();
        found.set(code, { code, confidence: "medium", context });
      }
    }
  }

  return [...found.values()];
}

function isValidCode(code: string): boolean {
  if (code.length < 3 || code.length > 20) return false;
  if (FALSE_POSITIVES.has(code)) return false;
  if (/^[0-9]+$/.test(code) && code.length < 4) return false; // too short for numeric
  return true;
}

function isKnownPattern(code: string): boolean {
  return KNOWN_CODE_PATTERNS.some((p) => p.test(code));
}
