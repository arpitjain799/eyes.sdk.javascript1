const {makeServer} = require('@applitools/eyes-universal/dist');

process.on('message', async message => {
  const {port} = await makeServer();
  process.send({universalPort: port});
});

