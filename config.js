import Insight from './lib';
import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import imongo from './imongo';

const logger = new Insight();
const client = new MongoClient('mongodb://localhost:27017');

function App() {
  const app = express();
  /**
   * whiteList any request parameters that you think need to be captured.
   * stream: To capture streaming data (deafult is false and true is Non-recommended) [Use omly if you are using express session or SSR]
   * realTimeSync: If you want to transport your data in realtime and not when system is idle (default is false and true is Non-recommended)
   */
  const inbound = logger.inbound({blacklistHeaders: [], whitelist: [], stream: false, realTimeSync: false});

  app.use(json({ limit: '50mb' }));
  app.use(inbound.mdw);
  app.post('/app', (req, res) => {
    // console.log(req.query);
    res.set('one-more', 'injected-headers');
    logger.customEvent('some-event', { foo: 'bar' }, 'info');
    throw 'error here';
    res.status(201).json({ foo: 'zar' });
    // res.send('hell')
  });

  // app.use(inbound.errMdw);
  return app;
}

async function server() {
  await client.connect();
  const MongoTr = await imongo(client, {dbName: 'LOG'});
  await logger.init([MongoTr]);
  logger.axios();
  logger.traceLogger();
  const app = App();
  app.listen(3001, ()=> console.log('Server is up'));
  return true;
}

server().catch(console.error);