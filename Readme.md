```js
const Insight = require('@rdev06/insight');

const logger = new Insight({
  Crash:{name: 'Crash', expire: 24000},
  Inbound: {name: 'Inbound', expire: 24000},
  OutBound: {name: 'OutBound', expire: 24000},
  Custom: {name: 'Custom', expire: 24000},
  Trace:{name: 'Trace', expire: 24000}
});




const express = require('express');


function App() {
  const app = express();
  /**
   * whiteList any request parameters that you think need to be captured.
   * stream: To capture streaming data (deafult is false and true is Non-recommended) [Use omly if you are using express session or SSR]
   * realTimeSync: If you want to transport your data in realtime and not when system is idle (default is false and true is Non-recommended)
   */
  const inbound = logger.inbound({reqHeaderBlacklist:[], resHeaderBlacklist: [], whitelist: [], stream: false, realTimeSync: false});

  app.use(express.json({ limit: '50mb' }));

  // To capture all request and responses
  app.use(inbound.mdw);
  app.post('/app', (req, res) => {
    res.set('one-more', 'injected-headers');
    /**
     * param(1): Any custom event name
     * param(2): Any data
     * param(3): Log Level ['info', 'debug', 'warn']
    */
    logger.customEvent('some-event', { foo: 'bar' }, 'info');
    throw 'error here';
    res.status(201).json({ foo: 'zar' });
  });

  // To capture errors produce during req, res controllers
  app.use(inbound.errMdw);
  return app;
}

async function server() {
 /**
  * An argument inside init to map Transports in a form of array
  * For simple Transport go inside library to get one example else
  * Transports were available like `imongo`.
 */
  await logger.init();
  logger.axios();
  logger.traceLogger();
  const app = App();
  app.listen(3001, ()=> console.log('Server is up'));
  return true;
}

server().catch(console.error);
```