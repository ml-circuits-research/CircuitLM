import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createService } from './service.mjs';
export async function createServer(options = {}) {
    const execute = await createService(options);
    const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    return http.createServer(async (req, res) => {
        try {
            if (req.method === 'GET' && req.url === '/health')
                return json(res, 200, { status: 'ok', model: 'sop-symbolic-r1', neural: false });
            if (req.method === 'GET' && req.url === '/v1/models')
                return json(res, 200, { object: 'list', data: [{ id: 'sop-symbolic-r1', object: 'model', created: 0, owned_by: 'local' }] });
            if (req.method !== 'POST' || !['/v1/chat/completions', '/v1/completions'].includes(req.url))
                return json(res, 404, { error: { message: 'Endpoint not supported', type: 'invalid_request_error' } });
            if (!req.headers['content-type']?.startsWith('application/json'))
                throw Object.assign(Error('Content-Type must be application/json'), { status: 415 });
            let bytes = 0;
            const chunks = [];
            for await (const chunk of req) {
                bytes += chunk.length;
                if (bytes > 131072)
                    throw Object.assign(Error('Request body limit is 128 KiB'), { status: 413 });
                chunks.push(chunk);
            }
            let body;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            }
            catch {
                throw Object.assign(Error('Malformed JSON'), { status: 400 });
            }
            if (!body || typeof body !== 'object' || Array.isArray(body))
                throw Object.assign(Error('Expected an object'), { status: 400 });
            const supported = new Set(['model', 'messages', 'prompt', 'stream', 'temperature', 'n', 'task', 'prefix', 'query', 'max_sentences', 'locale', 'trace', 'rounds']);
            for (const key of Object.keys(body))
                if (!supported.has(key))
                    throw Object.assign(Error(`Unsupported parameter ${key}; this is a strict non-streaming text subset, not the full OpenAI API`), { status: 400 });
            if (body.model !== undefined && body.model !== 'sop-symbolic-r1')
                throw Object.assign(Error('Unknown model'), { status: 404 });
            if (body.stream !== undefined && body.stream !== false || body.n !== undefined && body.n !== 1 || body.temperature !== undefined && body.temperature !== 0)
                throw Object.assign(Error('Only stream=false, n=1 and temperature=0 are supported'), { status: 400 });
            if (req.url === '/v1/chat/completions' && body.prompt !== undefined || req.url === '/v1/completions' && body.messages !== undefined)
                throw Object.assign(Error('Parameter does not belong to this endpoint'), { status: 400 });
            let text;
            if (req.url === '/v1/chat/completions') {
                if (!Array.isArray(body.messages) || body.messages.length !== 1 || body.messages[0]?.role !== 'user' || typeof body.messages[0].content !== 'string')
                    throw Object.assign(Error('This subset accepts exactly one user message with string content; history, system prompts and multimodal inputs are not silently ignored'), { status: 400 });
                text = body.messages[0].content;
            }
            else
                text = body.prompt;
            const result = execute({ text, task: body.task, prefix: body.prefix ?? '', query: body.query ?? '', limit: body.max_sentences ?? 3, locale: body.locale ?? 'en', trace: body.trace ?? false, rounds: body.rounds ?? 12 });
            const common = { id: 'sop-' + randomUUID(), created: Math.floor(Date.now() / 1000), model: 'sop-symbolic-r1' };
            const metadata = { method: result.method, execution: result.execution, scope: 'experimental symbolic service', ...(result.complete !== undefined ? { saturation_complete: result.complete } : {}), ...(result.text === '' ? { abstained: true } : {}), ...(body.trace ? { result } : {}) };
            return json(res, 200, req.url === '/v1/chat/completions' ? { ...common, object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content: result.text }, finish_reason: 'stop' }], sop: metadata } : { ...common, object: 'text_completion', choices: [{ index: 0, text: result.text, finish_reason: 'stop', logprobs: null }], sop: metadata });
        }
        catch (e) {
            json(res, e.status ?? (e.code === 'RESOURCE_LIMIT' ? 422 : 500), { error: { message: e.message, type: e.code === 'RESOURCE_LIMIT' ? 'resource_limit' : 'invalid_request_error' } });
        }
    });
}
