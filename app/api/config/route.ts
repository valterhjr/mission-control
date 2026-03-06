import { NextResponse } from 'next/server';
import { readFile, writeFile, rm, access } from 'fs/promises';
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

type AgentBody = {
    id: string;
    name?: string;
    model?: string;
    workspace?: string;
    agentDir?: string;
};

export async function POST(request: Request) {
    try {
        const body: AgentBody = await request.json();
        if (!body.id?.trim()) {
            return NextResponse.json({ ok: false, error: 'id é obrigatório' }, { status: 400 });
        }

        const raw = await readFile(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(raw);
        const list: ConfigAgent[] = config.agents?.list ?? [];

        if (list.find((a) => a.id === body.id)) {
            return NextResponse.json({ ok: false, error: 'Agente já existe' }, { status: 409 });
        }

        const newAgent: ConfigAgent = { id: body.id };
        if (body.name) newAgent.name = body.name;
        if (body.model) newAgent.model = body.model;
        if (body.workspace) newAgent.workspace = body.workspace;
        if (body.agentDir) newAgent.agentDir = body.agentDir;

        config.agents = { ...(config.agents ?? {}), list: [...list, newAgent] };
        await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save config';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id?.trim()) {
        return NextResponse.json({ ok: false, error: 'id é obrigatório' }, { status: 400 });
    }

    try {
        const raw = await readFile(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(raw);
        const list: ConfigAgent[] = config.agents?.list ?? [];

        const idx = list.findIndex((a) => a.id === id);
        if (idx === -1) {
            return NextResponse.json({ ok: false, error: 'Agente não encontrado' }, { status: 404 });
        }

        const agent = list[idx];

        // Remove from config first
        list.splice(idx, 1);
        config.agents = { ...(config.agents ?? {}), list };
        await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

        // Delete physical directories
        const deleted: string[] = [];
        const failed: { path: string; error: string }[] = [];

        const tryDelete = async (dirPath: string | undefined) => {
            if (!dirPath) return;
            try {
                await access(dirPath); // check it exists before deleting
                await rm(dirPath, { recursive: true, force: true });
                deleted.push(dirPath);
            } catch (err) {
                failed.push({ path: dirPath, error: (err as Error).message });
            }
        };

        await tryDelete(agent.agentDir);
        await tryDelete(agent.workspace);

        return NextResponse.json({ ok: true, deleted, failed });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete agent';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body: AgentBody = await request.json();
        if (!body.id?.trim()) {
            return NextResponse.json({ ok: false, error: 'id é obrigatório' }, { status: 400 });
        }

        const raw = await readFile(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(raw);
        const list: ConfigAgent[] = config.agents?.list ?? [];

        const idx = list.findIndex((a) => a.id === body.id);
        if (idx === -1) {
            return NextResponse.json({ ok: false, error: 'Agente não encontrado' }, { status: 404 });
        }

        list[idx] = {
            ...list[idx],
            ...(body.name !== undefined && { name: body.name }),
            ...(body.model !== undefined && { model: body.model }),
            ...(body.workspace !== undefined && { workspace: body.workspace }),
            ...(body.agentDir !== undefined && { agentDir: body.agentDir }),
        };

        config.agents = { ...(config.agents ?? {}), list };
        await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save config';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
