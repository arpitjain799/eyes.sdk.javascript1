function makeManagersStorage() {
  let managers = [];
  function setManager(manager) {
    managers.push(manager);
  }

  function getAllManagers() {
    return managers;
  }

  return {
    setManager,
    getAllManagers,
  };
}

module.exports = {makeManagersStorage};
