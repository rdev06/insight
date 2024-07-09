export const deleteFromReq = [
  'transitional',
  'transformRequest',
  'transformResponse',
  'xsrfCookieName',
  'xsrfHeaderName',
  'env',
  'maxContentLength',
  'maxBodyLength',
  'time'
];
export const deleteHeadersKeys = ['common', 'get', 'put', 'post', 'delete', 'head', 'patch'];
export const killWatchEvents = ['exit', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'];

export const axiosDeleteFromReqHeader = ['Content-Type'];
export const axiosDeleteFromResHeader = ['access-control-allow-origin', 'connection', 'content-length', 'content-type', 'date', 'etag', 'x-powered-by'];