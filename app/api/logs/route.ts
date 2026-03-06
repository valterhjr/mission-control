import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get('lines') || '50');
  const filter = searchParams.get('filter') || '';

  try {
    // Find latest log file
    const lsCmd = `ls -t /tmp/openclaw/openclaw-*.log 2>/dev/null | head -1`;
    const { stdout: latestLog } = await execAsync(lsCmd);
    const logPath = latestLog.trim();

    if (!logPath) {
      return NextResponse.json({ logs: [] });
    }

    // Tail logs
    let tailCmd = `tail -n ${lines} "${logPath}"`;
    if (filter) {
      tailCmd += ` | grep -i "${filter.replace(/"/g, '\\"')}"`;
    }

    const { stdout: logs } = await execAsync(tailCmd, { timeout: 5000 });
    const logLines = logs.trim().split('\n').filter(Boolean);

    return NextResponse.json({ logs: logLines });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Logs error:', error);
    return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
  }
}
