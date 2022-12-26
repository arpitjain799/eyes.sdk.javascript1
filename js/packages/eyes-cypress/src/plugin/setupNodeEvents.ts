import makeGlobalRunHooks from './hooks';

export default function({startServer, eyesConfig}: any) {
  return async function(...args: any[]) {
    const {port, closeManager, closeBatches, closeUniversalServer} = await startServer();

    const globalHooks = makeGlobalRunHooks({closeManager, closeBatches, closeUniversalServer});

    const [origOn, config] = args;

    if (eyesConfig.eyesIsGlobalHooksSupported) {
      for (const [eventName, eventHandler] of Object.entries(globalHooks)) {
        origOn.call(this, eventName, eventHandler);
      }
    }

    return Object.assign(config, eyesConfig, {eyesPort: port});
  };
}
