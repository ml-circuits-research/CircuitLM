import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default (a, vm) => one(a, "items", []).reduce((state, item, index) => { vm.tick(); return vm.run(one(a, "circuit"), { ...one(a, "with", {}), state, item, index }); }, one(a, "seed"));
