#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createService } from './src/service.mjs';
import { createServer } from './src/server.mjs';
import { createVM } from './src/vm.mjs';
import { factsToSOP } from './src/compiler.mjs';
async function readStdin() {
    process.stdin.setEncoding('utf8');
    let text = '';
    for await (const chunk of process.stdin) {
        text += chunk;
        if (text.length > 65536)
            throw Error('Input exceeds 65,536 UTF-16 code units');
    }
    return text;
}
const args = process.argv.slice(2), command = args.shift() ?? 'help';
const opt = (name, def) => {
    const i = args.indexOf('--' + name);
    if (i < 0)
        return def;
    if (i + 1 >= args.length || args[i + 1].startsWith('--'))
        throw Error('Missing value for --' + name);
    const value = args[i + 1];
    args.splice(i, 2);
    return value;
};
const flag = name => {
    const i = args.indexOf('--' + name);
    if (i < 0)
        return false;
    args.splice(i, 1);
    return true;
};
try {
    const json = flag('json'), tracePath = opt('trace', null), file = opt('file', null), limit = Number(opt('sentences', '3')), query = opt('query', ''), prefix = opt('prefix', ''), locale = opt('locale', 'en'), root = opt('library', null), packName = opt('pack', 'kb.default');
    if (command === 'help' || command === '--help') {
        console.log(`SOP Symbolic Lab (Node.js >=22; no npm dependencies)\n\nnode cli.mjs summarize --sentences 3 < article.txt\nnode cli.mjs semantic-summary --sentences 4 < facts.txt\nnode cli.mjs expand < facts.txt\nnode cli.mjs complete --prefix "Atlas has a risk of " < facts.txt\nnode cli.mjs ask "Summarize: ..."\nnode cli.mjs ingest --file facts.txt > learned.sop\nnode cli.mjs inspect\nnode cli.mjs serve --host 127.0.0.1 --port 8000\n\nOptions: --json, --trace PATH, --query TEXT, --locale en|ro, --library ROOT, --pack MODULE.\nEnglish semantic grammar only. Empty completion means abstention, not proof of absence.`);
        process.exit(0);
    }
    if (command === 'serve') {
        const host = opt('host', '127.0.0.1'), port = Number(opt('port', '8000'));
        if (!Number.isInteger(port) || port < 0 || port > 65535)
            throw Error('Invalid port');
        if (args.length)
            throw Error('Unexpected serve arguments');
        const server = await createServer({ roots: root ? [root] : [], packName });
        server.requestTimeout = 15000;
        server.headersTimeout = 10000;
        server.listen(port, host, () => console.error(`Listening on http://${host}:${server.address().port}`));
    }
    else if (command === 'inspect') {
        const vm = await createVM();
        console.log(JSON.stringify({ circuits: [...vm.modules.keys()], primitives: [...vm.primitives.keys()] }, null, 2));
    }
    else {
        const allowPartial = flag('allow-partial');
        if (args.some(a => a.startsWith('--')))
            throw Error('Unknown command-line option');
        const text = file ? await readFile(file, 'utf8') : args.length ? args.join(' ') : await readStdin();
        if (text.length > 65536)
            throw Error('Input exceeds 65,536 UTF-16 code units');
        if (command === 'ingest') {
            const vm = await createVM();
            if (root)
                await vm.load(root);
            const pack = vm.run(packName), parsed = vm.run('language.parse', { text, lexicon: pack.lexicon });
            const compiled = factsToSOP(parsed, { source: file ?? 'stdin', allowPartial });
            console.log(compiled.source);
            console.error(JSON.stringify(compiled.report));
        }
        else {
            const execute = await createService({ roots: root ? [root] : [], packName });
            const result = execute({ text, task: command === 'ask' ? undefined : command, limit, query, prefix, locale, trace: Boolean(tracePath) });
            if (tracePath)
                await writeFile(tracePath, JSON.stringify(result, null, 2));
            console.log(json ? JSON.stringify(result, null, 2) : result.text);
            if (result.text === '')
                console.error('No supported continuation was found; the service abstained.');
        }
    }
}
catch (e) {
    console.error(e.message);
    if (e.coverage)
        console.error(JSON.stringify(e.coverage, null, 2));
    process.exitCode = 1;
}
