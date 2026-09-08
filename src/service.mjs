import { VM, createVM } from './vm.mjs';
import { validatePack } from './verify.mjs';
/** Host boundary: validation and transport only. Task choice and content policy are SOP. */
export async function createService({ roots = [], packName = 'kb.default', fuel = 4000000 } = {}) {
    const template = await createVM();
    for (const root of roots)
        await template.load(root);
    validatePack(template.run(packName));
    return function execute({ text, task, query = '', prefix = '', limit = 3, locale = 'en', trace = false, rounds = 12 } = {}) {
        if (typeof text !== 'string' || text.length > 65536)
            throw Object.assign(Error('Text must be a string of at most 65,536 UTF-16 code units'), { status: 400 });
        if (task !== undefined && typeof task !== 'string')
            throw Object.assign(Error('Task must be a string'), { status: 400 });
        if (typeof trace !== 'boolean')
            throw Object.assign(Error('Trace must be boolean'), { status: 400 });
        if (typeof query !== 'string' || typeof prefix !== 'string' || query.length > 4096 || prefix.length > 4096)
            throw Object.assign(Error('Invalid query/prefix'), { status: 400 });
        if (!Number.isInteger(limit) || limit < 1 || limit > 12 || !Number.isInteger(rounds) || rounds < 1 || rounds > 32)
            throw Object.assign(Error('Limit must be 1..12; rounds must be 1..32'), { status: 400 });
        if (!['en', 'ro'].includes(locale))
            throw Object.assign(Error('Locale must be en or ro'), { status: 400 });
        const vm = new VM({ fuel, trace });
        vm.modules = template.modules;
        vm.primitives = template.primitives;
        if (task === undefined) {
            const parsed = vm.run('request.parse', { text });
            task = parsed.mode;
            text = parsed.text;
        }
        const pack = vm.run(packName);
        const result = vm.run('tasks.dispatch', { mode: task, text, query, prefix, limit, locale, pack, rounds });
        return { ...result, execution: vm.stats(), ...(trace ? { trace: vm.trace } : {}) };
    };
}
