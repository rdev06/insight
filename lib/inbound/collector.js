import { ObjectId } from 'bson';

export default async function(req, res, next) {
    const _id = new ObjectId();
    const timestamp = new Date();
    const toInsert = {
      _id,
      method: req.method.toUpperCase(),
      utcDate: new Date(timestamp.toISOString().slice(0, 11) + '00:00:00.000Z'),
      timestamp,
      ...this.computeReq(req)
    };
    if (this.sync) {
      await Promise.all(this.transports.map(transport => transport.create(toInsert)));
    } else {
      this.transports.forEach(transport => {
        transport.update(_id, toInsert);
      });
    }
    req.insightId = _id;

    let _chunk = '';

    if (this.stream) {
      const wsp = res.write;
      res.write = function (chunk) {
        _chunk += chunk;
        wsp.call(res, chunk);
      };
    }

    const esp = res.end;
    const _self = this;
    res.end = async function (chunk) {
      _chunk += chunk;
      esp.call(res, chunk);
      await _self.computeRes(_id, timestamp, req, res, _chunk);
    };
    next();
    if(res.isErrored){
      return this.transports.forEach(transport => {
        transport.delete(_id);
      });
    }
  }