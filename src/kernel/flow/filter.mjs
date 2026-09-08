import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default (a, vm) => one(a, "items", []).filter((item, index) => { vm.tick(); return Boolean(vm.run(one(a, "circuit"), { ...one(a, "with", {}), item, index })); });
