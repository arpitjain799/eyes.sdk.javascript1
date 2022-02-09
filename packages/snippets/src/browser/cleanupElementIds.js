function cleanupElementIds([elements]) {
  if (!elements) return []
  let elementsFromSelectors = []
  elements.map(element => {
    if (typeof element === 'string') {
      const curr = document.querySelectorAll(element)
      elementsFromSelectors = elementsFromSelectors.concat(Object.values(curr))
    }
  })
  elements = elementsFromSelectors.length > 0 ? elementsFromSelectors : elements

  elements.forEach(element => {
    element.removeAttribute('data-applitools-selector')
    if (element.getRootNode) {
      for (let root = element.getRootNode(); root !== document; root = root.host.getRootNode()) {
        root.host.removeAttribute('data-applitools-selector')
      }
    }
  })
}

module.exports = cleanupElementIds
