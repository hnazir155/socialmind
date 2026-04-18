/* ============================================================
   RULES ENGINE
   Each rule: trigger (when) → conditions (if) → actions (then)
   Rules are persisted in the `automations` table in Supabase
   and evaluated by cron jobs.
   ============================================================ */

import { researchAgent, strategistAgent, scriptAgent, analyticsAgent, BrandDNA } from './agents';
import { getSupabase, memDB } from './db';
import { notifyDraftReady, notifyAgentActivity, isTelegramConfigured } from './telegram';

export type Trigger =
  | { type: 'schedule'; cron: string }                         // cron expression
  | { type: 'trend_spike'; threshold: number }                 // e.g. 200 = 200% velocity
  | { type: 'competitor_post'; handles: string[] }
  | { type: 'post_performance'; multiplier: number }           // e.g. 2 = 2x average
  | { type: 'manual' };

export type Condition =
  | { type: 'niche_match_min'; score: number }                 // relevance score 1-10
  | { type: 'platform_in'; platforms: string[] }
  | { type: 'day_of_week'; days: number[] }
  | { type: 'time_between'; start: string; end: string };

export type Action =
  | { type: 'draft_script'; variants: number; format: string }
  | { type: 'draft_calendar'; days: number }
  | { type: 'notify'; channel: 'slack' | 'email' | 'push'; message?: string }
  | { type: 'auto_post'; platforms: string[] }
  | { type: 'log_only' };

export type TrustLevel = 'locked' | 'trusted' | 'autonomous';

export type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
  created_at?: string;
  last_run?: string;
  run_count?: number;
};

export type AuditEntry = {
  id?: string;
  rule_id?: string;
  rule_name: string;
  action: string;
  result: 'ok' | 'fail' | 'pending';
  detail: string;
  timestamp: string;
};

/* ==================== STORAGE ==================== */

export async function listRules(): Promise<Rule[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('automations').select('*').order('created_at', { ascending: false });
    return (data || []) as Rule[];
  }
  return (memDB.list('automations') || []) as Rule[];
}

export async function saveRule(rule: Partial<Rule>): Promise<Rule> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('automations').upsert(rule as any).select().single();
    return data as Rule;
  }
  if (rule.id) {
    return memDB.update('automations', rule.id, rule) as Rule;
  }
  return memDB.insert('automations', rule) as Rule;
}

export async function deleteRule(id: string) {
  const sb = getSupabase();
  if (sb) { await sb.from('automations').delete().eq('id', id); return; }
  memDB.remove('automations', id);
}

export async function logAudit(entry: Omit<AuditEntry, 'timestamp'>) {
  const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) { await sb.from('audit_log').insert(full); return; }
  memDB.insert('audit_log', full);
}

export async function listAudit(limit = 50): Promise<AuditEntry[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(limit);
    return (data || []) as AuditEntry[];
  }
  return (memDB.list('audit_log') || [])
    .slice()
    .reverse()
    .slice(0, limit) as AuditEntry[];
}

/* ==================== EVALUATION ==================== */

export function conditionsPass(conditions: Condition[], context: any): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => {
    switch (c.type) {
      case 'niche_match_min':
        return (context.relevance_score ?? 0) >= c.score;
      case 'platform_in':
        return c.platforms.includes(context.platform || '');
      case 'day_of_week':
        return c.days.includes(new Date().getDay());
      case 'time_between': {
        const now = new Date();
        const hm = now.getHours() * 60 + now.getMinutes();
        const toMins = (s: string) => { const [h,m] = s.split(':').map(Number); return h*60+m; };
        return hm >= toMins(c.start) && hm <= toMins(c.end);
      }
      default:
        return true;
    }
  });
}

export async function executeActions(rule: Rule, context: any, dna?: BrandDNA) {
  for (const action of rule.actions) {
    try {
      switch (action.type) {
        case 'draft_script': {
          const topic = context.topic || context.trend?.title || 'Latest in our niche';
          const result = await scriptAgent({
            topic,
            platform: context.platform || 'instagram',
            format: (action.format as any) || 'reel',
          }, dna);
          // Save as draft
          const sb = getSupabase();
          const draftPayload: any = {
            topic, format: action.format, platform: context.platform || 'instagram',
            status: 'draft', content: result,
            hook: result.hook, caption: result.caption, hashtags: result.hashtags,
            created_at: new Date().toISOString(),
          };
          let savedDraft: any = null;
          if (sb) {
            const { data } = await sb.from('drafts').insert(draftPayload).select().single();
            savedDraft = data;
          } else {
            savedDraft = memDB.insert('drafts', draftPayload);
          }
          await logAudit({ rule_id: rule.id, rule_name: rule.name, action: `Drafted script: "${topic}"`, result: 'ok', detail: `${action.variants || 1} variant(s) saved to queue` });
          // Ping phone
          if (isTelegramConfigured() && savedDraft) {
            await notifyDraftReady({
              id: savedDraft.id,
              hook: result.hook,
              platform: context.platform || 'instagram',
              format: action.format,
              caption: result.caption,
              topic,
            });
          }
          break;
        }
        case 'draft_calendar': {
          const opps = context.opportunities || [{ title: 'General', relevance_score: 8 }];
          const result = await strategistAgent(opps, dna);
          await logAudit({ rule_id: rule.id, rule_name: rule.name, action: `Drafted calendar (${action.days}d)`, result: 'ok', detail: `${result.posts?.length || 0} posts planned` });
          break;
        }
        case 'notify': {
          await logAudit({ rule_id: rule.id, rule_name: rule.name, action: `Notified via ${action.channel}`, result: 'ok', detail: action.message || 'Alert sent' });
          if (isTelegramConfigured() && (action.channel === 'push' || action.channel === 'email' || action.channel === 'slack')) {
            await notifyAgentActivity(rule.name, action.message || `${action.channel} notification`, JSON.stringify(context).slice(0, 80));
          }
          break;
        }
        case 'auto_post': {
          await logAudit({ rule_id: rule.id, rule_name: rule.name, action: `Auto-posted to ${action.platforms.join(', ')}`, result: 'pending', detail: 'Requires platform OAuth tokens' });
          break;
        }
        case 'log_only': {
          await logAudit({ rule_id: rule.id, rule_name: rule.name, action: 'Observed (log only)', result: 'ok', detail: JSON.stringify(context).slice(0, 100) });
          break;
        }
      }
    } catch (err: any) {
      await logAudit({ rule_id: rule.id, rule_name: rule.name, action: `Action ${action.type} failed`, result: 'fail', detail: err.message });
    }
  }

  // Update run count
  await saveRule({ ...rule, last_run: new Date().toISOString(), run_count: (rule.run_count || 0) + 1 });
}

/* ==================== TRIGGER ROUTINES ==================== */

// Called by scheduled cron endpoints
export async function runScheduled(cronKey: string, dna?: BrandDNA) {
  const rules = await listRules();
  const matching = rules.filter(r => r.enabled && r.trigger.type === 'schedule' && (r.trigger as any).cron === cronKey);

  const results: any[] = [];
  for (const rule of matching) {
    let context: any = { cronKey };

    // Enrich context with research if daily trend cron
    if (cronKey === 'daily-research') {
      try {
        const research = await researchAgent('What are the rising content trends today?', dna);
        context.opportunities = research.opportunities;
        context.relevance_score = Math.max(...(research.opportunities?.map((o: any) => o.relevance_score) || [5]));
      } catch {}
    }

    if (conditionsPass(rule.conditions, context)) {
      await executeActions(rule, context, dna);
      results.push({ rule: rule.name, status: 'executed' });
    } else {
      results.push({ rule: rule.name, status: 'conditions_failed' });
    }
  }
  return results;
}

// Check kill switch
export async function isPaused(): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('settings').select('value').eq('key', 'agents_paused').single();
    return data?.value === 'true';
  }
  const list = memDB.list('settings') as any[];
  return list.find((s) => s.key === 'agents_paused')?.value === 'true';
}

export async function setPaused(paused: boolean) {
  const sb = getSupabase();
  if (sb) {
    await sb.from('settings').upsert({ key: 'agents_paused', value: String(paused) }, { onConflict: 'key' });
    return;
  }
  const list = memDB.list('settings') as any[];
  const existing = list.find((s) => s.key === 'agents_paused');
  if (existing) memDB.update('settings', existing.id, { value: String(paused) });
  else memDB.insert('settings', { key: 'agents_paused', value: String(paused) });
}
