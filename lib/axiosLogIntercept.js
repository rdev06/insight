import { axiosDeleteFromReqHeader, axiosDeleteFromResHeader, deleteFromReq } from './constant.js';
import { ObjectId } from 'bson';
import { omit } from './utils/_.js';

function saveResponse(transports, res, resHeaderBlackList) {
  const endTime = new Date();
  if (res.config?._id) {
    const toUpdate = {
      res: { status: res.status, statusText: res.statusText, data: res.data },
      'time.endTime': endTime,
      'time.duration': endTime - res.config.time.startTime,
    };

    res.headers.forEach((value, key)=> {
      if(!resHeaderBlackList.includes(key)){
        if(!toUpdate.res.headers) toUpdate.res.headers = {};
        toUpdate.res.headers[key] = value
      }
    })

    if(!res.ok){
      toUpdate.flag = 'warn'
    }

    transports.forEach((transport) => transport.update(res.config._id, toUpdate));
  }
}

export default async function (axios, transports, option) {
  const reqHeaderBlackList = axiosDeleteFromReqHeader.concat(option.reqHeaderBlackList || []);
  const resHeaderBlackList = axiosDeleteFromResHeader.concat(option.resHeaderBlackList || []);
  axios.interceptors.request.use(
    async function (req) {
      req._id = new ObjectId();
      req.time = {
        startTime: new Date(),
        utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0))
      };

      const saveReq = omit(req, deleteFromReq);
      saveReq.method = saveReq.method.toUpperCase();
      saveReq.headers = omit(req.headers, reqHeaderBlackList);
      await Promise.all(transports.map((transport) => transport.create({ _id: req._id, req: saveReq, time: req.time })));
      return req;
    }
  );

  axios.interceptors.response.use(
    async function (res) {
      saveResponse(transports, res, resHeaderBlackList);
      return res;
    }
  );
}