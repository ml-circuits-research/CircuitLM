import { one, hash } from '../../generic.mjs';
import { reify, graphSource } from '../../graph.mjs';
export default (a, vm) => {
    const c = one(a, 'circuit');
    if (typeof c === 'string')
        return vm.run(c, one(a, 'with', {}));
    const module = vm.modules.get(c.name);
    if (!module || c.contentHash !== hash(graphSource(reify(module))))
        throw Error('Stale or invalid circuit reference');
    return vm.run(c.name, one(a, 'with', {}));
};
