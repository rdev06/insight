import Inbound from './inbound/index.js';
import axiosLogIntercept from './axiosLogIntercept.js';
import { killWatchEvents } from './constant.js';
import { checkLicense, fetchLicense } from './utils/index.js';

const logTransport =
  (label) =>
  (type = 'inbound') => ({
    create: (d) => {
      console.dir(Object.assign(d, { label, type }), { depth: 10 });
      return d._id.toString();
    },
    update: (id, d) => {
      id = id.toString();
      !!d._id && (d._id = d._id.toString());
      console.dir(Object.assign(d, { label, type }), { depth: 10 });
    },
    delete: (id) => console.dir({ label, type, id: id.toString() }),
    error: (d) => console.dir(Object.assign(d, { label, type }), { depth: 10 })
  });

export default class Insight {
  constructor(option) {
    this.option = option || {};
  }
  async init(transports=[]) {
    this.licenseValidUpto = await fetchLicense(this.option.license || {type: 'TRIAL'})
    if (!transports?.length|| this.option.useConsoleTransport) transports.push(logTransport('INSIGHT'));
    const trFn = (name, expire) => Promise.all(transports.map((tr) => tr(name, expire)));
    const CrashTr = await trFn(this.option.Crash?.name || 'Crash', this.option.Crash?.expire);
    this.InboundTr = await trFn(this.option.Inbound?.name || 'Inbound', this.option.Inbound?.expire);
    this.AxiosTr = await trFn(this.option.Outbound?.name || 'OutBound', this.option.OutBound?.expire);
    this.CustomEvTr = await trFn(this.option.Custom?.name || 'Custom', this.option.Custom?.expire);
    this.TraceTr = await trFn(this.option.Trace?.name || 'Trace', this.option.Trace?.expire);
    killWatchEvents.forEach((eventType) => {
      process.on(eventType, async (err) => {
        const toSend = {
          eventType,
          reason: err.stack?.toString().split('\n'),
          timestamp: new Date(),
          utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0))
        };
        for (const transport of CrashTr) {
          if(this.option.printCrash){
            console.error(toSend)
          }
          await transport.error(toSend);
        }
        process.exit(0);
      });
    });
  }

  async inbound(option) {
    this.licenseValidUpto = await checkLicense(this.licenseValidUpto, this.option.license)
    const inbound = new Inbound(this.InboundTr, option);
    return {
      mdw: inbound.collector.bind(inbound),
      errMdw: inbound.errCollector.bind(inbound)
    };
  }

  async axios(axios, option={}) {
    this.licenseValidUpto = await checkLicense(this.licenseValidUpto, this.option.license);
    if(!axios) throw new Error('INSIGHT: You need to pass an instance of axios here for logger');
    axiosLogIntercept(axios, this.AxiosTr, option);
  }

  async customEvent(eventName, data, level = 'info') {
    this.licenseValidUpto = await checkLicense(this.licenseValidUpto, this.option.license)
    const toCreate = {
      eventName,
      level,
      data,
      timeStamp: new Date(),
      utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0))
    };
    this.CustomEvTr.forEach((transport) => {
      transport.create(toCreate);
    });
  }
  async traceLogger() {
    this.licenseValidUpto = await checkLicense(this.licenseValidUpto, this.option.license)
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = async (chunk, encoding, callback) => {
      const toCreate = {
        chunk: chunk.trim(),
        timestamp: new Date(),
        utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0))
      };
      this.TraceTr.forEach((transport) => {
        transport.create(toCreate);
      });
      return originalStdoutWrite(chunk, encoding, callback);
    };
  }
}
