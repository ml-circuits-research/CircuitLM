import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => stable(one(a, "left")) === stable(one(a, "right"));
