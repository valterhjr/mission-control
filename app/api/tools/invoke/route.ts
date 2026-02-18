import { NextResponse } from 'next/server';

type Body = { tool: string; args: object };

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const gatewayUrl = process.env.GATEWAY_URL as string;
    const token = process.env.GATEWAY_TOKEN as string;

    if (!gatewayUrl || !token) {
      return NextResponse.json({ ok: false, details: 'Missing gateway config' }, { status: 500 });
    }

    const url = `${gatewayUrl.replace(/\/$/, '')}/tools/invoke`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tool: body.tool, args: body.args })
    });

    const envelope = await res.json();
    if (!envelope.ok) {
      return NextResponse.json({ ok: false, details: envelope?.details ?? 'Gateway error' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, result: envelope.result ?? {} });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, details: message }, { status: 500 });
  }
}
