import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createVM, HOME } from '../src/vm.mjs';
async function walk(dir) {
    const files = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory())
            files.push(...await walk(p));
        else
            files.push(p);
    }
    return files.sort();
}
const vm = await createVM(), unknown = [];
for (const [module, ast] of vm.modules)
    for (const node of ast.nodes.values())
        if (!vm.modules.has(node.command) && !vm.primitives.has(node.command))
            unknown.push({ module, command: node.command });
const kernelFiles = await walk(path.join(HOME, 'src/kernel'));
const forbidden = [], terms = /\b(summarize|deduplicate|deduplicates|overdue|retries|Atlas|BookQ|realizeFact)\b/;
for (const file of kernelFiles) {
    const code = await readFile(file, 'utf8');
    if (terms.test(code))
        forbidden.push({ file: path.relative(HOME, file), reason: 'domain/task-specific vocabulary' });
    if (/(?:node:(?:fs|http|https|child_process)|\beval\s*\(|new Function\s*\()/u.test(code))
        forbidden.push({ file: path.relative(HOME, file), reason: 'external side-effect or eval facility' });
}
const sopFiles = await walk(path.join(HOME, 'sop'));
const sourceFiles = (await walk(path.join(HOME, 'src'))).filter(x => x.endsWith('.mjs'));
const metrics = async (files) => ({ files: files.length, lines: (await Promise.all(files.map(async (f) => (await readFile(f, 'utf8')).split('\n').length - 1))).reduce((a, b) => a + b, 0) });
const digest = createHash('sha256');
for (const f of sourceFiles)
    digest.update(path.relative(HOME, f)).update(await readFile(f));
const report = { activeCircuits: vm.modules.size, primitiveCommands: vm.primitives.size, kernel: await metrics(kernelFiles), allHostSource: await metrics(sourceFiles), sop: await metrics(sopFiles), kernelAndHostSourceSHA256: digest.digest('hex'), unknownDirectCommands: unknown, forbiddenKernelFindings: forbidden, persistentKBNonSOPFiles: sopFiles.filter(x => !x.endsWith('.sop')).map(x => path.relative(HOME, x)), passed: unknown.length === 0 && forbidden.length === 0 && sopFiles.every(x => x.endsWith('.sop')), limitation: 'Static pattern audit plus runtime tests; not a formal absence-of-semantics or sandbox proof' };
await writeFile(path.join(HOME, 'reports/architecture-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed)
    process.exitCode = 1;
