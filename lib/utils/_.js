import omit from 'lodash.omit';

export function isObjectEmpty(inputObject) {
  return !Object.keys(inputObject).length;
}

export function omitAssign(object, keys, assign) {
  const toReturn = omit(object, keys);
  for (const e of keys) {
    if (e.includes('*')) {
      const rx = new RegExp('^' + e);
      for (const k in object) {
        if (rx.test(k)) {
          delete toReturn[k];
        }
      }
    }
  }
  if(assign){
    for (const k in assign) {
      if(object[k]){
        toReturn[k] = assign[k]
      }
    }
  }
  return toReturn;
}