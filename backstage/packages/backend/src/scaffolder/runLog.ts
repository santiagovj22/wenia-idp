/**
 * FR-17 / AD-12: Run log — appends one JSON line per Generation Run or
 * Rejected Request to data/runs.jsonl.
 * Single writer (AD-1): only this module writes to the file.
 */
import fs from 'fs';
import path from 'path';

export type RunOutcome = 'succeeded' | 'failed' | 'rejected';

export interface RunRecord {
  runId: string;
  serviceName: string;
  outcome: RunOutcome;
  step?: string;
  reasonCode?: string;
  durationMs: number;
  templateVersion: string;
  ts: string;
}

function getLogPath(): string {
  // In Docker: /app/data/runs.jsonl (data/ is a named volume).
  // Locally: ./data/runs.jsonl relative to cwd.
  const dataDir = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
  return path.join(dataDir, 'runs.jsonl');
}

export function appendRunRecord(record: RunRecord): void {
  const line = JSON.stringify(record) + '\n';
  try {
    fs.appendFileSync(getLogPath(), line, 'utf8');
  } catch (e) {
    // Never crash the run because logging failed.
    console.error('[wenia-module] failed to write run log:', e);
  }
}
