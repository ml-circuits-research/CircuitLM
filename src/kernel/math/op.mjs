import { one, stable } from '../../generic.mjs';
/** Scalar mechanics only; scores and thresholds are supplied by SOP callers. */
export default a => {
    const x = one(a, 'a', 0), y = one(a, 'b', 0), op = one(a, 'op');
    if (['and', 'or', 'not'].includes(op)) {
        if (typeof x !== 'boolean' || op !== 'not' && typeof y !== 'boolean')
            throw Error('Boolean operands required');
        return op === 'not' ? !x : op === 'and' ? x && y : x || y;
    }
    if (op === 'eq')
        return stable(x) === stable(y);
    if (typeof x !== 'number' || !Number.isFinite(x) || typeof y !== 'number' || !Number.isFinite(y))
        throw Error('Finite numeric operands required');
    let result;
    switch (op) {
        case 'add':
            result = x + y;
            break;
        case 'sub':
            result = x - y;
            break;
        case 'mul':
            result = x * y;
            break;
        case 'div':
            if (y === 0)
                throw Error('Division by zero');
            result = x / y;
            break;
        case 'min':
            result = Math.min(x, y);
            break;
        case 'max':
            result = Math.max(x, y);
            break;
        case 'sqrt':
            if (x < 0)
                throw Error('Negative square root');
            result = Math.sqrt(x);
            break;
        case 'log':
            if (x <= 0)
                throw Error('Invalid logarithm');
            result = Math.log(x);
            break;
        case 'lt': return x < y;
        case 'le': return x <= y;
        case 'gt': return x > y;
        case 'ge': return x >= y;
        default: throw Error('Unknown scalar operator ' + op);
    }
    if (!Number.isFinite(result))
        throw Error('Non-finite arithmetic result');
    return result;
};
