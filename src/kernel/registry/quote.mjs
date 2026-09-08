import { one, hash } from '../../generic.mjs';
import { reify, graphSource } from '../../graph.mjs';
export default (a, vm) => {
    const name = one(a, 'name'), m = vm.modules.get(name);
    if (!m)
        throw Error('Unknown circuit');
    const program = reify(m);
    return { ...program, contentHash: hash(graphSource(program)) };
};
