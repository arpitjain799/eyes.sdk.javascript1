const spec = require('../../dist/browser/spec-driver');

function socketCommands(socket, refer) {
  socket.command('Driver.executeScript', ({context, script, arg = []}) => {
    return spec.executeScript(refer.deref(context), script, derefArgs(arg));
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
  socket.command('Driver.findElement', ({selector}) => {
    const res = spec.findElement(refer.deref(selector));
    return refer.ref(res);
  });
  socket.command('Driver.findElements', ({selector}) => {
    const elements = spec.findElements(refer.deref(selector));
    let result = []
    for(const el of elements){
      result.push(refer.ref(el))
    }
    return result
  });

  socket.command('Driver.parentContext', currentContext => {
    const context = spec.parentContext(refer.deref(currentContext));
    return refer.ref(context);
  });

  function derefArgs(arg){
    if(Array.isArray(arg)) {
    const derefArg = [];
    for (const argument of arg) {
      if(Array.isArray(argument)){
        const arr = [];
        for(const entry of argument){
          arr.push(refer.deref(entry))
        }
        derefArg.push(refer.deref(arr))
      } else {
      derefArg.push(refer.deref(argument))
      } 
    }
    return derefArg
    } else {
      return arg
    }
  }
}

module.exports = {socketCommands};
