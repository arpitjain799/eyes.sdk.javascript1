const {isShadowRoot} = require('@applitools/dom-shared')

function cleanupElementIds([elements]) {
  elements.forEach(element => {
    element.removeAttribute('data-applitools-selector')
    if (element.getRootNode) {
      for (
        let root = element.getRootNode();
        root !== document && isShadowRoot(root);
        root = root.host.getRootNode()
      ) {
        root.host.removeAttribute('data-applitools-selector')
      }
    }
  })
}

module.exports = cleanupElementIds
