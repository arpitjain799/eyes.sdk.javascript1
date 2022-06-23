const path = require('path');
const chalk = require('chalk');

function getLegacyPuginFilePath(cwd, configContent) {
  const pluginsPath = configContent.match(/cypress\/plugins\/[a-z, 0-9]*.js/);
  if (!pluginsPath) {
    console.log(chalk.cyan('Plugins legacy path was not found'));
    return;
  }
  console.log(chalk.cyan('Plugins legacy path was found!'));
  return path.resolve(cwd, pluginsPath[0]);
}

module.exports = getLegacyPuginFilePath;
