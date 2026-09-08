import { readFile } from 'node:fs/promises';
import { createVM } from '../src/vm.mjs';
import { validatePack, auditProofs } from '../src/verify.mjs';
const args = process.argv.slice(2), roots = [], sourcePaths = [];
let packName = 'kb.default';
try {
    while (args.length) {
        const flag = args.shift(), value = args.shift();
        if (!value)
            throw Error('Missing value for ' + flag);
        if (flag === '--library')
            roots.push(value);
        else if (flag === '--pack')
            packName = value;
        else if (flag === '--source')
            sourcePaths.push(value);
        else
            throw Error('Unknown option ' + flag);
    }
    if (!sourcePaths.length)
        sourcePaths.push('examples/manual.txt');
    const vm = await createVM();
    for (const root of roots)
        await vm.load(root);
    for (const [name, definition] of vm.modules) {
        for (const node of definition.nodes.values()) {
            if (!vm.modules.has(node.command) && !vm.primitives.has(node.command))
                throw Error(name + ': unknown command ' + node.command);
        }
    }
    const pack = vm.run(packName), sources = Object.fromEntries(await Promise.all(sourcePaths.map(async (p) => [p, await readFile(p, 'utf8')])));
    const schema = validatePack(pack, { sources });
    const proof = auditProofs(pack.facts, pack, sources);
    console.log(JSON.stringify({ schema, proof, note: 'Source integrity and rule safety do not prove that an authored rule faithfully interprets its source.' }, null, 2));
}
catch (e) {
    console.error(e.message);
    process.exitCode = 1;
}
