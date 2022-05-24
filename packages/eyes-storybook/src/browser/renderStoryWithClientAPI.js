const getClientAPI = require('./getClientAPI');

function renderStoryWithClientAPI(index) {
  return new Promise(resolve => {
    let api;
    try {
      api = getClientAPI();
      api.selectStory(index);
      const storyInfo = api.getStoryInfo(index);
      api.onStoryRendered(() => resolve(storyInfo));
    } catch (ex) {
      resolve({message: ex.message, version: api ? api.version : undefined});
    }
  });
}

module.exports = renderStoryWithClientAPI;
