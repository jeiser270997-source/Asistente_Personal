require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
async function test() {
  const providers = [
    { name: 'Cerebras', url: process.env.PROVIDER_1_BASE_URL, key: process.env.PROVIDER_1_API_KEY, model: process.env.PROVIDER_1_MODEL },
    { name: 'NVIDIA', url: process.env.PROVIDER_2_BASE_URL, key: process.env.PROVIDER_2_API_KEY, model: process.env.PROVIDER_2_MODEL },
    { name: 'OpenRouter', url: process.env.PROVIDER_3_BASE_URL, key: process.env.PROVIDER_3_API_KEY, model: process.env.PROVIDER_3_MODEL },
  ];
  for (const p of providers) {
    console.log(`\n--- Testing ${p.name} (${p.model}) ---`);
    try {
      const res = await fetch(`${p.url.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.key}` },
        body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: 'Say "OK" in one word' }], max_tokens: 10 })
      });
      const text = await res.text();
      if (res.ok) {
        const data = JSON.parse(text);
        console.log(`✅ ${data.choices?.[0]?.message?.content || 'no content'}`);
      } else {
        console.log(`❌ ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}
test();
