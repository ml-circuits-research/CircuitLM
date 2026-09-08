import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default (a, vm) => one(a, "items", []).map((item, index) => { vm.tick(); return vm.run(one(a, "circuit"), { ...one(a, "with", {}), item, index }); });
