import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => Object.assign(Object.create(null), ...all(a, "value"));
