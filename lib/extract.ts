// Extract a balanced {...} or [...] substring starting at `open` (which must
// point at the opening brace/bracket). String-aware so braces inside JSON
// strings don't throw off the depth count. Used to pull embedded JSON state
// out of server-rendered HTML (Eventbrite, Luma, Meetup).
export function extractBalanced(s: string, open: number): string | null {
  const openChar = s[open];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = open; j < s.length; j++) {
    const c = s[j];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) return s.slice(open, j + 1);
    }
  }
  return null;
}

// Parse the JSON object/array that immediately follows `marker` in `html`.
export function parseJsonAfter(html: string, marker: RegExp): unknown | null {
  const m = html.match(marker);
  if (!m || m.index === undefined) return null;
  // Skip to the first { or [ after the marker.
  let i = m.index + m[0].length;
  while (i < html.length && html[i] !== "{" && html[i] !== "[") i++;
  if (i >= html.length) return null;
  const slice = extractBalanced(html, i);
  if (!slice) return null;
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}
