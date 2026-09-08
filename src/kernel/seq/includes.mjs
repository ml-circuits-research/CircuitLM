import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => { const target = stable(one(a, "item")); return one(a, "items", []).some(x => stable(x) === target); };
