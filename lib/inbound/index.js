import { errorToJson } from '../utils/index.js';
import computeRes from './computeRes.js';
import collector from './collector.js';
import { isObjectEmpty, omit } from '../utils/_.js';

const omitHeaders = ['user-agent', 'postman-token', 'accept-encoding', 'connection'];

export default class Inbound {
  constructor(transports, option = {}) {
    this.transports = transports;
    this.reqHeaderBlacklist = option.reqHeaderBlacklist || [];
    this.resHeaderBlacklist = option.resHeaderBlacklist || [];
    this.whitelist = option.whitelist || [];
    this.stream = option.stream || false;
    this.sync = option.realTimeSync || false;
    if (this.stream) {
      console.warn('insight: Use this Option only if really required (like express-session), else this will slow down your performance');
    }
  }

  computeReq(req, omitBlackList = true) {
    const toReturn = {
      path: req.path,
      method: req.method,
      depth: req.path.replaceAll('/', '_').slice(1),
      req: {}
    };
    const headers = omit(req.headers, omitBlackList ? omitHeaders.concat(this.reqHeaderBlacklist) : omitHeaders);
    if (!isObjectEmpty(headers)) {
      toReturn.req.headers = headers;
    }
    for (const e of ['body', 'query']) {
      if (!isObjectEmpty(req[e])) {
        toReturn.req[e] = req[e];
      }
    }
    return toReturn;
  }

  async errCollector(err, req, res, next) {
    const error = {
      req: this.computeReq(req, false),
      timestamp: new Date(),
      utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
      error: errorToJson(err),
      level: 'error'
    };
    this.transports.forEach((transport) => {
      if (req.insightId) {
        return transport.update(req.insightId, error);
      }
      return transport.error(error);
    });
    res.isErrored = !req.insightId;
    return next(err.message || err);
  }
}

Inbound.prototype.computeRes = computeRes;
Inbound.prototype.collector = collector;
