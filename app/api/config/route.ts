import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json');

type ConfigAgent = {
    id: string;
    name?: string;
    model?: string;
    workspace?: string;
    agentDir?: string;
    heartbeat?: { every: string };
};

export async function GET() {
    try {
        // Try reading the OpenClaw config file directly
        const raw = await readFile(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(raw);

        const agentDefaults = config.agents?.defaults ?? {};
        const agentList: ConfigAgent[] = config.agents?.list ?? [];
        const modelsMap = agentDefaults.models ?? {};

        // Normalize agent list with defaults applied
        const agents = agentList.map((a: ConfigAgent) => ({
            id: a.id,
            name: a.name || a.id,
            model: a.model || agentDefaults.model?.primary || 'unknown',
            workspace: a.workspace || agentDefaults.workspace || '',
            agentDir: a.agentDir || '',
            hasHeartbeat: !!a.heartbeat,
        }));

        // Extract model IDs
        const models = Object.keys(modelsMap);

        return NextResponse.json({
            ok: true,
            agents,
            models,
            defaults: {
                model: agentDefaults.model?.primary || '',
                workspace: agentDefaults.workspace || '',
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to read config';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
