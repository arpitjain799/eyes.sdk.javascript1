const spec = require('./spec-driver');

function socketCommands(socket, refer) {
  socket.command('Driver.extractContext', async target => {
    const res = spec.extractContext();
    return refer.deref(res);
  });

  socket.command('Driver.executeScript', async ({context, script, arg}) => {
    return spec.executeScript(context, script, arg);
  });
  socket.command('Driver.mainContext', context => {
    const mainContext = spec.mainContext(refer.deref(context));
    return refer.ref(mainContext, context);
  });
  socket.command('Driver.isElement', element => {
    return spec.isElement(element);
  });
  socket.command('Driver.isSelector', selector => {
    return spec.isElement(selector);
  });
  socket.command('Driver.getViewportSize', () => {
    return spec.getViewportSize();
  });
  socket.command('Driver.setViewportSize', vs => {
    spec.setViewportSize(vs);
  });
  socket.command('Driver.findElement', element => {
    const res = spec.findElement(refer.deref(element));
    return refer.ref(res);
  });

  socket.command('Driver.parentContext', currentContext => {
    const context = spec.parentContext(refer.deref(currentContext));
    return refer.ref(context);
  });
}

module.exports = {socketCommands};
