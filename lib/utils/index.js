export const errorToJson = (err) => ({ ...err, message: err.message || err, stack: err.stack?.split('\n') });
export const computeDepth = (path) => {
  const startIndex = path.indexOf('/');
  if (startIndex < 0) return path;
  const queryIndex = path.indexOf('?');
  const endsIndex = queryIndex !== -1 ? queryIndex : path.length;
  const depth = path.slice(startIndex, endsIndex).split('/').filter(String);
  return depth.join('_');
};
export const fetchLicense = async (license) => {
  if(license.type === 'TRIAL') return Date.now() + 2592000000;
  const body = {
    e: 'License',
    m: 'check',
    args: [license]
  };
  const validity = await fetch(`https://solocit.com`, { method: 'POST', body: JSON.stringify(body) });
  if (Date.now() > validity.validUpto) {
    throw { message: 'INSIGHT: You need to renew your license' };
  }
  return validity.validUpto;
}


export const checkLicense = (validUpto, license) => {
  if(Date.now() < validUpto){
    return validUpto
  }
  return fetchLicense(license)
}
