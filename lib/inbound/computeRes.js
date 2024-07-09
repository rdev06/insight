import omit from 'lodash.omit';
export default async function (_id, timestamp, req, res, _chunk) {
  let level = 'info';
  if (res.statusCode > 200 && res.statusCode < 300) level = 'success';
  else if (res.statusCode > 399 && res.statusCode < 500) level = 'warn';
  else if (res.statusCode > 499) level = 'error';
  const toUpdate = {
    statusCode: res.statusCode,
    level,
    duration: Date.now() - timestamp.getTime(),
    res: {
      headers: res.getHeaders(),
      body: null
    }
  };

  const returnType = toUpdate.res.headers['content-type']?.split(';').map((e) => e.trim());
  if (returnType?.[0] === 'application/json') {
    toUpdate.res.body = JSON.parse(_chunk);
  } else {
    toUpdate.res.body = _chunk.toString(returnType?.[1] || 'utf-8');
  }
  toUpdate.res.headers = omit(toUpdate.res.headers, this.resHeaderBlacklist)
  for (const k of this.whitelist) {
    if(!!req[k]){
      toUpdate[`req.${k}`] = req[k];
    }
  }
  if (this.sync) {
    await Promise.all(this.transports.map((transport) => transport.update(_id, toUpdate)));
  } else {
    this.transports.forEach((transport) => {
      transport.update(_id, toUpdate);
    });
  }
};