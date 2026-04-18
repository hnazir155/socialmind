import { NextRequest, NextResponse } from 'next/server';
import { researchAgent, strategistAgent, scriptAgent, publisherAgent, analyticsAgent, agentChat } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { name: string } }) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not set. Add it to your .env.local or Vercel env vars.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { name } = params;

    let result;
    switch (name) {
      case 'research':
        result = await researchAgent(body.query || 'What should we post about this week?', body.dna);
        break;
      case 'strategist':
        result = await strategistAgent(body.opportunities || body.input, body.dna);
        break;
      case 'script':
        result = await scriptAgent(body, body.dna);
        break;
      case 'publisher':
        result = await publisherAgent(body.draft);
        break;
      case 'analytics':
        result = await analyticsAgent(body.metrics, body.dna);
        break;
      case 'chat':
        result = { message: await agentChat(body.agent, body.message, body.history || [], body.dna) };
        break;
      default:
        return NextResponse.json({ error: `Unknown agent: ${name}` }, { status: 404 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error(`[agent/${params.name}]`, err);
    return NextResponse.json({ error: err.message || 'Agent failed' }, { status: 500 });
  }
}
