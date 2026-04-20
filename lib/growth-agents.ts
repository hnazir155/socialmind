/* ============================================================
   GROWTH AGENTS — Scout → Enrich → Qualify → Outreach
   ============================================================ */

import { openai as openaiClient } from './openai';
import { getSupabase, memDB } from './db';

/* ============================================================
   ICP DEFINITION
   ============================================================ */
export const ICP = {
  services: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'AI Ad Creative', 'Shopify Development', 'CRO'],
  deal_size_usd: { min: 180, max: 550 },
  markets: ['Pakistan', 'UAE', 'Saudi Arabia', 'UK', 'USA'],
  target_industries: ['e-commerce','retail','fashion','beauty','skincare','food','restaurants','education','real estate','healthcare','fitness','electronics','jewelry'],
  pain_signals: ['low ROAS','poor creative','no social media','bad website','slow Shopify','running ads but no conversions','no Google presence'],
};

export type RawProspect = {
  name: string; website?: string; phone?: string; email?: string;
  address?: string; city?: string; country: string; industry: string;
  description?: string; source: string; source_query: string;
  place_id?: string; instagram_url?: string; linkedin_url?: string;
  rating?: number; review_count?: number;
};

export type QualificationResult = {
  score: number; icp_fit: 'hot' | 'warm' | 'cold' | 'skip';
  reason: string; pain_signals: string[];
  recommended_service: string; outreach_angle: string;
};

/* ============================================================
   SCOUT AGENT — finds raw prospects
   ============================================================ */
export async function scoutAgent(q: { query: string; market: string; industry: string; limit?: number }): Promise<RawProspect[]> {
  const results: RawProspect[] = [];
  const placesKey = process.env.GOOGLE_PLACES_API_KEY;

  // Try Google Places first
  if (placesKey) {
    const places = await scoutGooglePlaces(q, placesKey);
    results.push(...places);
  }

  // Supplement or fallback with AI discovery
  if (results.length < (q.limit || 10)) {
    const aiResults = await scoutViaAI(q, results.map(r => r.name));
    results.push(...aiResults);
  }

  return results.slice(0, q.limit || 20);
}

async function scoutGooglePlaces(q: { query: string; market: string; industry: string }, apiKey: string): Promise<RawProspect[]> {
  const countryMap: Record<string,string> = { UAE:'ae', PK:'pk', UK:'gb', US:'us', KSA:'sa' };
  const cc = countryMap[q.market] || 'ae';
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q.query)}&region=${cc}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
    return (data.results || []).map((p: any) => ({
      name: p.name, address: p.formatted_address,
      city: (p.formatted_address || '').split(',').slice(-3)[0]?.trim() || '',
      country: q.market, industry: q.industry,
      description: (p.types || []).join(', '),
      source: 'google_places', source_query: q.query,
      place_id: p.place_id, rating: p.rating,
      review_count: p.user_ratings_total,
    }));
  } catch { return []; }
}

async function scoutViaAI(q: { query: string; market: string; industry: string }, skip: string[]): Promise<RawProspect[]> {
  const openai = openaiClient;
  if (!openai) return [];
  const mktNames: Record<string,string> = {
    UAE:'UAE (Dubai, Abu Dhabi, Sharjah)', PK:'Pakistan (Karachi, Lahore, Islamabad)',
    UK:'UK (London, Manchester, Birmingham)', US:'USA (New York, LA, Houston)',
    KSA:'Saudi Arabia (Riyadh, Jeddah, Dammam)',
  };

  // Market-specific examples to guide quality
  const examples: Record<string,string> = {
    PK: 'e.g. Khaadi, Bonanza Satrangi, Gul Ahmed, J. (Junaid Jamshed), Sapphire, Alkaram, Ideas by Gul Ahmed, Breakout, Cross Stitch',
    UAE: 'e.g. Noon, Ounass, Sun & Sand Sports, Namshi, Faces, Sivvi, Kibsons, Mumzworld',
    UK: 'e.g. ASOS, Boohoo, Missguided, PrettyLittleThing, Gymshark, Cult Beauty, Charlotte Tilbury',
    US: 'e.g. Warby Parker, Glossier, Allbirds, Bombas, Chubbies, Tuft & Needle, Purple',
    KSA: 'e.g. Jarir Bookstore, Al Baik, Extra Stores, Danube Home, Homebox, Nayomi, Areej',
  };

  const prompt = `You are a B2B sales researcher. List 8 REAL, NAMED businesses for a performance marketing agency to prospect.

Query: "${q.query}" in ${mktNames[q.market] || q.market}
Examples of the kind of businesses wanted: ${examples[q.market] || 'real established brands'}
Skip these: ${skip.slice(0,5).join(', ') || 'none'}

RULES — VERY IMPORTANT:
1. Only use REAL business names (brands/companies you are certain exist)
2. NO generic names like "Ecommerce Store", "Beauty Brand", "Fashion Shop", "Online Store", "Digital Business"
3. Each business must have a real website domain
4. Focus on established SMBs that sell products and could benefit from better Meta/Google/TikTok ads
5. Return FEWER results if needed — 3 quality leads beats 10 fake ones

Return ONLY valid JSON array:
[{"name":"Real Brand Name","website":"https://realdomain.com","city":"City Name","country":"${q.market}","industry":"${q.industry}","description":"what they sell","source":"web_search","source_query":"${q.query}","instagram_url":"https://instagram.com/handle or null","phone":null,"email":null}]`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o', messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500, temperature: 0.2, // lower temp = more factual
    });
    const text = (res.choices[0]?.message?.content || '[]').replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    // Hard filter: reject obviously generic/hallucinated names
    const genericTerms = ['ecommerce', 'online store', 'fashion brand', 'beauty brand',
      'digital store', 'web store', 'business', 'enterprise', 'gateway', 'planners',
      'startup', 'private limited', 'pvt ltd', 'commerce', 'easy commerce', 'fast e-'];
    return parsed.filter((p: any) => {
      if (!p.name || p.name.length < 3) return false;
      const nameLower = p.name.toLowerCase();
      return !genericTerms.some(t => nameLower.includes(t));
    });
  } catch { return []; }
}

/* ============================================================
   ENRICHMENT AGENT
   ============================================================ */
export async function enrichmentAgent(prospect: RawProspect): Promise<Record<string,any>> {
  
  const openai = openaiClient;
  if (!openai) return {};
  const prompt = `Business intelligence for a performance marketing agency:

Business: ${prospect.name}
Website: ${prospect.website || 'unknown'}
Location: ${prospect.city}, ${prospect.country}
Industry: ${prospect.industry}
Description: ${prospect.description || 'n/a'}

Return ONLY valid JSON (no markdown):
{"estimated_size":"micro|small|medium","estimated_revenue":"under 1M|1-5M|5-20M USD","has_shopify":true/false,"has_website":true/false,"website_quality":"none|poor|basic|good|excellent","runs_paid_ads":true/false/null,"social_presence":"none|weak|moderate|strong","pain_signals":["..."],"opportunity":"what can our agency do for them","best_channel":"email|linkedin|whatsapp|instagram_dm","decision_maker_title":"Owner|Marketing Manager|etc","buying_urgency":"low|medium|high","notes":"any relevant intel"}`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o', messages: [{ role:'user', content: prompt }],
      max_tokens: 500, temperature: 0.3,
    });
    const text = (res.choices[0]?.message?.content || '{}').replace(/```json|```/g,'').trim();
    return JSON.parse(text);
  } catch { return { error:'enrichment_failed' }; }
}

/* ============================================================
   QUALIFIER AGENT — scores 1-10, flags hot/warm/cold/skip
   ============================================================ */
export async function qualifierAgent(prospect: RawProspect, enrichment: Record<string,any>): Promise<QualificationResult> {
  
  let score = 5;
  const signals: string[] = [];

  // Rule-based scoring
  if (enrichment.has_shopify) { score += 1.5; signals.push('Has Shopify store'); }
  if (enrichment.runs_paid_ads === true) { score += 1; signals.push('Already runs ads (upsell)'); }
  if (enrichment.runs_paid_ads === false && enrichment.has_website) { score += 0.5; signals.push('Has website, no ads yet'); }
  if (['poor','none'].includes(enrichment.website_quality)) { score += 1; signals.push('Poor/no website = CRO opportunity'); }
  if (['none','weak'].includes(enrichment.social_presence)) { score += 1; signals.push('Weak social = content opportunity'); }
  if (enrichment.buying_urgency === 'high') { score += 1; signals.push('High urgency'); }
  if (ICP.target_industries.some(i => (prospect.industry||'').toLowerCase().includes(i))) { score += 0.5; signals.push('High-fit industry'); }
  if (enrichment.estimated_size === 'micro') score -= 1;

  score = Math.min(10, Math.max(1, Math.round(score)));
  let icp_fit: 'hot'|'warm'|'cold'|'skip' = score >= 8 ? 'hot' : score >= 6 ? 'warm' : score <= 3 ? 'skip' : 'cold';
  if (enrichment.estimated_size === 'micro' && score < 6) icp_fit = 'skip';

  // AI angle for hot/warm only
  const openai = openaiClient;
  if (openai && (icp_fit === 'hot' || icp_fit === 'warm')) {
    try {
      const prompt = `Sales strategist for performance marketing agency. Prospect: ${prospect.name} (${prospect.industry}, ${prospect.city} ${prospect.country}). Enrichment: ${JSON.stringify(enrichment)}. Pain signals: ${signals.join(', ')}. Score: ${score}/10.

Return ONLY valid JSON:
{"reason":"2 sentences why this score","recommended_service":"best service fit + why","outreach_angle":"specific hook for first contact referencing something real about them"}`;

      const res = await openai.chat.completions.create({
        model: 'gpt-4o', messages: [{ role:'user', content: prompt }],
        max_tokens: 300, temperature: 0.4,
      });
      const text = (res.choices[0]?.message?.content || '{}').replace(/```json|```/g,'').trim();
      const ai = JSON.parse(text);
      return { score, icp_fit, reason: ai.reason || signals.join('. '), pain_signals: signals, recommended_service: ai.recommended_service || 'Meta Ads', outreach_angle: ai.outreach_angle || '' };
    } catch {}
  }

  return {
    score, icp_fit, reason: signals.join('. ') || 'Standard scoring',
    pain_signals: signals,
    recommended_service: enrichment.has_shopify ? 'Shopify CRO + Meta Ads' : 'Meta Ads',
    outreach_angle: `Your ${prospect.industry} business in ${prospect.city} could grow significantly with targeted ${enrichment.has_shopify ? 'CRO and paid ads' : 'digital advertising'}.`,
  };
}

/* ============================================================
   OUTREACH AGENT — drafts personalized messages
   ============================================================ */
export async function outreachAgent(prospect: any, qual: QualificationResult, channel: string = 'email'): Promise<Array<{variant:string;subject?:string;body:string;channel:string}>> {
  
  const openai = openaiClient;
  if (!openai) return [];

  const channelGuide: Record<string,string> = {
    email: 'Professional email. Subject + body. Max 150 words. Clear CTA (30min call). No "I hope this finds you well".',
    whatsapp: 'Casual WhatsApp. Max 100 words. Conversational, not salesy. End with simple question.',
    instagram_dm: 'Instagram DM. Max 80 words. Mention something real about their content. Friendly tone.',
    linkedin: 'LinkedIn DM. Max 120 words. Professional but human. Reference their role.',
  };

  const prompt = `Senior business development manager at performance marketing agency.

PROSPECT: ${prospect.name} | ${prospect.industry} | ${prospect.city}, ${prospect.country}
Website: ${prospect.website || 'none'}
Pain: ${qual.pain_signals.join(', ')}
Best service fit: ${qual.recommended_service}
Outreach angle: ${qual.outreach_angle}

CHANNEL: ${channel} — ${channelGuide[channel] || channelGuide.email}
AGENCY: Meta/Google/TikTok Ads, AI Creative, Shopify, CRO

Write 3 variants (A=pain-focused, B=results-focused, C=curiosity/question).
Never sound templated. Reference something specific. One pain per message.

Return ONLY valid JSON array:
[{"variant":"A","subject":"email subject or null","body":"..."},{"variant":"B","subject":null,"body":"..."},{"variant":"C","subject":null,"body":"..."}]`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o', messages: [{ role:'user', content: prompt }],
      max_tokens: 1000, temperature: 0.8,
    });
    const text = (res.choices[0]?.message?.content || '[]').replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(text);
    return parsed.map((d: any) => ({ ...d, channel }));
  } catch { return []; }
}

/* ============================================================
   FULL PIPELINE — Scout → Enrich → Qualify → Save → Notify
   ============================================================ */
export async function runScoutMission(mission: { id?: string; query: string; market: string; industry: string; limit?: number }): Promise<{ found:number; hot:number; warm:number; cold:number }> {
  const sb = getSupabase();
  const raw = await scoutAgent({ ...mission, limit: mission.limit || 15 });
  let hot = 0, warm = 0, cold = 0;
  console.log(`[Scout] Found ${raw.length} raw prospects for: ${mission.query}`);

  for (const r of raw) {
    try {
      const enrichment = await enrichmentAgent(r);
      const qual = await qualifierAgent(r, enrichment);
      console.log(`[Scout] ${r.name}: score=${qual.score} fit=${qual.icp_fit}`);
      if (qual.icp_fit === 'skip') continue;

      const prospectData = {
        name: r.name, website: r.website, country: r.country, city: r.city,
        industry: r.industry, description: r.description, email: r.email,
        phone: r.phone, instagram_url: r.instagram_url, linkedin_url: r.linkedin_url,
        scout_source: r.source, source_query: r.source_query, place_id: r.place_id,
        qualification_score: qual.score, icp_fit: qual.icp_fit,
        score_reason: qual.reason, pain_signals: qual.pain_signals,
        enrichment: enrichment, stage: 'qualified',
        discovered_at: new Date().toISOString(),
        enriched_at: new Date().toISOString(),
        qualified_at: new Date().toISOString(),
      };

      let saved: any = null;
      if (sb) {
        const { data, error } = await sb.from('prospects').insert(prospectData).select().single();
        if (error) {
          console.error('Supabase insert error:', error.message, error.code);
        }
        saved = data;
      } else {
        saved = memDB.insert('prospects', prospectData);
      }

      if (qual.icp_fit === 'hot') { hot++; }
      else if (qual.icp_fit === 'warm') { warm++; }
      else { cold++; }
    } catch (err: any) {
      console.error('Pipeline error for', r.name, err.message);
    }
  }

  return { found: raw.length, hot, warm, cold };
}
