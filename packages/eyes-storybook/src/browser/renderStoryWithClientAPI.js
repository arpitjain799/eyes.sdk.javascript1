const getClientAPI = require('./getClientAPI');

function renderStoryWithClientAPI(index) {
  return new Promise((resolve) => {
    let api;
    try {
      api = getClientAPI();
      api.onStoryRendered(resolve)
      api.selectStory(index);
    } catch (ex) {
      resolve({message: ex.message, version: api ? api.version : undefined});
    }
  })
}

module.exports = renderStoryWithClientAPI;
