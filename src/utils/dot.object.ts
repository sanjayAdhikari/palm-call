import dot from 'dot-object'

dot.keepArray = true;

export function objectToDot(obj: Object, target?: Object) {
    if (target) return dot.dot(obj ?? {}, target);
    return dot.dot(obj ?? {})
}
