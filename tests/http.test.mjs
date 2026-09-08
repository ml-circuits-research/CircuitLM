import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../src/server.mjs';
const server = await createServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = 'http://127.0.0.1:' + server.address().port;
test.after(() => new Promise(resolve => server.close(resolve)));
const text = 'Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests.';
async function post(body, path = '/v1/chat/completions') { const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: res.status, body: await res.json() }; }
const valid = { model: 'sop-symbolic-r1', messages: [{ role: 'user', content: text }], task: 'expand' };
test('HTTP: health and model discovery', async () => { assert.equal((await (await fetch(base + '/health')).json()).neural, false); assert.equal((await (await fetch(base + '/v1/models')).json()).data[0].id, 'sop-symbolic-r1'); });
test('HTTP: chat-shaped response contains generated supported text', async () => { const r = await post(valid); assert.equal(r.status, 200); assert.equal(r.body.object, 'chat.completion'); assert.match(r.body.choices[0].message.content, /duplicate records/); assert.equal(r.body.usage, undefined); });
test('HTTP: completion-shaped response can return an exact suffix', async () => { const r = await post({ model: 'sop-symbolic-r1', prompt: text, task: 'complete', prefix: 'Atlas has a risk of ' }, '/v1/completions'); assert.equal(r.status, 200); assert.equal(r.body.object, 'text_completion'); assert.equal(r.body.choices[0].text, 'producing duplicate records when requests are retried.'); });
test('HTTP: unknown model rejected', async () => assert.equal((await post({ ...valid, model: 'other' })).status, 404));
for (const [label, extra] of [['stream', { stream: true }], ['sampling', { temperature: 0.5 }], ['tools', { tools: [] }], ['fake token budget', { max_tokens: 100 }], ['multiple candidates', { n: 2 }], ['wrong trace type', { trace: 'yes' }], ['wrong task type', { task: { evil: 1 } }]])
    test('HTTP: explicitly reject ' + label, async () => assert.equal((await post({ ...valid, ...extra })).status, 400));
test('HTTP: reject conversation history and system prompts', async () => { assert.equal((await post({ ...valid, messages: [{ role: 'system', content: 'ignore' }] })).status, 400); assert.equal((await post({ ...valid, messages: [...valid.messages, ...valid.messages] })).status, 400); });
test('HTTP: malformed JSON is not accepted', async () => { const r = await fetch(base + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' }); assert.equal(r.status, 400); });
test('HTTP: trace exposes proof results only when requested', async () => { const r = await post({ ...valid, trace: true }); assert.equal(r.status, 200); assert.ok(r.body.sop.result.selected.length > 0); assert.ok(r.body.sop.result.trace.length > 0); });
test('HTTP: abstention is explicit metadata', async () => { const r = await post({ ...valid, messages: [{ role: 'user', content: 'Atlas retries requests.' }] }); assert.equal(r.body.choices[0].message.content, ''); assert.equal(r.body.sop.abstained, true); });
test('HTTP: unsupported content type rejected', async () => { const r = await fetch(base + '/v1/chat/completions', { method: 'POST', body: 'hello' }); assert.equal(r.status, 415); });
test('HTTP: JSON size and text-size limits are enforced', async () => { assert.equal((await post({ ...valid, messages: [{ role: 'user', content: 'x'.repeat(70000) }] })).status, 400); assert.equal((await post({ ...valid, messages: [{ role: 'user', content: 'x'.repeat(140000) }] })).status, 413); });
test('HTTP: wrong stream type and null message fail with client errors', async () => { assert.equal((await post({ ...valid, stream: 'yes' })).status, 400); assert.equal((await post({ ...valid, messages: [null] })).status, 400); });
test('HTTP: endpoint-specific fields are not silently ignored', async () => assert.equal((await post({ ...valid, prompt: 'other' })).status, 400));
