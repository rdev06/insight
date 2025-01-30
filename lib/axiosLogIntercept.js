import { axiosDeleteFromReqHeader, axiosDeleteFromResHeader, deleteFromReq } from './constant.js';
import { ObjectId } from 'bson';
import { omitAssign } from './utils/_.js';

function saveResponse(transports, res, resHeaderBlackList) {
  if (res.config?._id) {
    const toUpdate = {
      res: { status: res.status, statusText: res.statusText, data: res.data },
      timestamp: res.config.time.startTime, // may be transporters will be timeseries databases
      duration: new Date() - res.config.time.startTime
    };
    toUpdate.res.headers = omitAssign(res.headers, resHeaderBlackList);

    if (!res.ok) {
      toUpdate.flag = 'warn';
    }

    transports.forEach((transport) => transport.update(res.config._id, toUpdate));
  }
}

export default async function (axios, transports, option) {
  const reqHeaderBlackList = axiosDeleteFromReqHeader.concat(option.reqHeaderBlackList || []);
  const resHeaderBlackList = axiosDeleteFromResHeader.concat(option.resHeaderBlackList || []);
  axios.interceptors.request.use(async function (req) {
    req._id = new ObjectId();
    req.time = {
      startTime: new Date()
    };

    const toDeleteFromReq = deleteFromReq.concat(reqHeaderBlackList.map((e) => 'headers.' + e));
    const saveReq = omitAssign(req, toDeleteFromReq, {
      body: (req.body instanceof Buffer || req.body instanceof ReadableStream) && 'stream'
    });
    saveReq.method = saveReq.method.toUpperCase();
    await Promise.all(transports.map((transport) => transport.create({ _id: req._id, req: saveReq, timestamp: req.time.startTime })));
    return req;
  });

  axios.interceptors.response.use(async function (res) {
    saveResponse(transports, res, resHeaderBlackList);
    return res;
  });
}
