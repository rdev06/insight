export function isObjectEmpty(inputObject) {
  return !Object.keys(inputObject).length;
}

export function omit(object, keys) {
  const toReturn = structuredClone(object);
  for (const e of keys) {
    if (!e.includes('*')) {
      delete toReturn[e];
    } else {
      const rx = new RegExp('^' + e);
      for (const k in object) {
        if (rx.test(k)) {
          delete toReturn[k];
        }
      }
    }
  }
  return toReturn;
}