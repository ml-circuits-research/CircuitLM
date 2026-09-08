import { one } from '../../generic.mjs';
import { validateGraph } from '../../graph.mjs';
export default (a, vm) => vm.runAST(validateGraph(one(a, 'program'), vm).module, one(a, 'with', {}));
