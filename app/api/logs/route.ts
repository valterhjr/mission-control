import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_DIR = '/tmp/openclaw';
const LOG_PATTERN = /^openclaw-.*\.log$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lines = Math.min(Math.max(parseInt(searchParams.get('lines') || '50'), 1), 500);
  const filter = searchParams.get('filter') || '';

  try {
    // Find latest log file using fs — no shell involved
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(LOG_DIR, { withFileTypes: true });
    } catch {
      return NextResponse.json({ logs: [] });
    }

    const logFiles = entries
      .filter(e => e.isFile() && LOG_PATTERN.test(e.name))
      .map(e => ({
        name: e.name,
        mtime: fs.statSync(path.join(LOG_DIR, e.name)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (logFiles.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const logPath = path.join(LOG_DIR, logFiles[0].name);

    // Read file content — no shell interpolation
    const content = fs.readFileSync(logPath, 'utf8');
    let logLines = content.split('\n').filter(Boolean);

    // Filter in JS — no grep, no injection risk
    if (filter) {
      const filterLower = filter.toLowerCase();
      logLines = logLines.filter(line => line.toLowerCase().includes(filterLower));
    }

    // Take last N lines
    logLines = logLines.slice(-lines);

    return NextResponse.json({ logs: logLines });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Logs error:', error);
    return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
  }
}
