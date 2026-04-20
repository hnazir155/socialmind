import { sendTelegram } from './telegram';
import type { QualificationResult } from './growth-agents';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://socialmind-two.vercel.app';

function esc(s: string): string {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export async function notifyTelegramHotLead(prospect: any, qual: QualificationResult) {
  const flag: Record<string,string> = { UAE:'🇦🇪', PK:'🇵🇰', UK:'🇬🇧', US:'🇺🇸', KSA:'🇸🇦' };
  const countryFlag = flag[prospect.country] || '🌍';

  const text = [
    `🔥 <b>HOT LEAD FOUND</b>`,
    ``,
    `🏢 <b>${esc(prospect.name)}</b>`,
    `${countryFlag} ${esc(prospect.city || prospect.country)} · ${esc(prospect.industry)}`,
    `⭐ Score: ${qual.score}/10`,
    ``,
    `💡 <b>Why:</b> ${esc(qual.reason)}`,
    `🎯 <b>Best fit:</b> ${esc(qual.recommended_service)}`,
    ``,
    `📩 <b>Angle:</b> <i>${esc(qual.outreach_angle)}</i>`,
  ].join('\n');

  return sendTelegram(text, {
    keyboard: [
      [
        { text: '✍️ Draft Outreach', callback_data: `draft-outreach:${prospect.id}` },
        { text: '👁️ View Profile', url: `${APP_URL}/growth/pipeline?id=${prospect.id}` },
      ],
      [
        { text: '🗑️ Skip This Lead', callback_data: `skip-lead:${prospect.id}` },
      ],
    ],
  });
}

export async function notifyTelegramMissionComplete(mission: any, result: { found:number; hot:number; warm:number; cold:number }) {
  const text = [
    `✅ <b>Scout Mission Complete</b>`,
    ``,
    `🔍 Query: <i>${esc(mission.query)}</i>`,
    `🌍 Market: ${mission.market}`,
    ``,
    `📊 <b>Results:</b>`,
    `🔥 Hot leads: ${result.hot}`,
    `🟡 Warm leads: ${result.warm}`,
    `🧊 Cold leads: ${result.cold}`,
    `📋 Total scanned: ${result.found}`,
  ].join('\n');

  return sendTelegram(text, {
    keyboard: [[
      { text: '🎯 View Pipeline', url: `${APP_URL}/growth/pipeline` },
    ]],
    silent: result.hot === 0,
  });
}

export async function notifyTelegramDraftOutreach(prospect: any, drafts: any[]) {
  if (!drafts.length) return;
  const d = drafts[0];

  const text = [
    `✍️ <b>Outreach Draft Ready</b>`,
    ``,
    `🏢 ${esc(prospect.name)} · ${esc(prospect.country)}`,
    `📱 Channel: ${d.channel?.toUpperCase()}`,
    ``,
    d.subject ? `📌 Subject: <i>${esc(d.subject)}</i>\n` : '',
    `📝 <i>${esc(d.body?.slice(0,200))}${(d.body||'').length > 200 ? '…' : ''}</i>`,
  ].filter(Boolean).join('\n');

  return sendTelegram(text, {
    keyboard: [
      [
        { text: '✅ Approve & Queue', callback_data: `approve-outreach:${prospect.id}:${d.channel}` },
        { text: '🔄 Regenerate', callback_data: `regen-outreach:${prospect.id}` },
      ],
      [
        { text: '👁️ See All 3 Variants', url: `${APP_URL}/growth/outreach?prospect=${prospect.id}` },
      ],
    ],
  });
}
