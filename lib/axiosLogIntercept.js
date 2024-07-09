import omit from 'lodash.omit';
import FetchAxios from '@rdev06/fetch-axios/dist/fetchAxios.js';
import { deleteFromReq, deleteHeadersKeys } from './constant.js';
import { ObjectId } from 'bson';

const axios = new FetchAxios();

function saveResponse(transports, res) {
  const endTime = new Date();
  if (res.config?._id) {
    const toUpdate = {
      res: { status: res.status, statusText: res.statusText, data: res.data, headers: res.headers },
      'time.endTime': endTime,
      'time.duration': endTime - res.config.time.startTime
    };
    transports.forEach((transport) => transport.update(res.config._id, toUpdate));
  }
}

export default async function (transports) {
  const _id = new ObjectId();
  axios.interceptors.request.use(
    async function (req) {
      req._id = _id;
      req.time = {
        startTime: new Date(),
        utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0))
      };

      const saveReq = omit(req, deleteFromReq);
      saveReq.headers = omit(req.headers, deleteHeadersKeys);

      await Promise.all(transports.map((transport) => transport.create({ _id, req: saveReq, time: req.time, label })));
      return req;
    },
    async (err) => {
      await Promise.all(transports.map(transport => transport.error(err)))
      return Promise.reject(err);
    }
  );

  axios.interceptors.response.use(
    async function (res) {
      saveResponse(transports, res);
      return res;
    },
    (err) => {
      saveResponse(transports, { config: err.config, ...err.response });
      return Promise.reject(err);
    }
  );
};
