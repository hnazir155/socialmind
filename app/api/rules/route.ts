import { NextRequest, NextResponse } from 'next/server';
import { listRules, saveRule, deleteRule } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rules = await listRules();
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rule = await saveRule(body);
  return NextResponse.json({ rule });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const rule = await saveRule(body);
  return NextResponse.json({ rule });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await deleteRule(id);
  return NextResponse.json({ ok: true });
}
