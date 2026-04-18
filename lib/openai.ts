import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'missing-key',
  });
  return _client;
}

// Proxy so existing `openai.chat.completions...` calls still work
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export const MODEL = 'gpt-4o';

export async function chat(opts: {
  system: string;
  user: string;
  jsonMode?: boolean;
  temperature?: number;
}) {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    temperature: opts.temperature ?? 0.7,
    response_format: opts.jsonMode ? { type: 'json_object' } : undefined,
  });
  return res.choices[0].message.content || '';
}
