function addElementIds([elements, ids]) {
  if (!elements) return []
  let elementsFromSelectors = []

  elements.map(element => {
    if (typeof element === 'string') {
      const curr = document.querySelectorAll(element)
      elementsFromSelectors = elementsFromSelectors.concat(Object.values(curr))
    }
  })
  elements = elementsFromSelectors.length > 0 ? elementsFromSelectors : elements

  return elements.map((element, index) => {
    const path = [element]
    if (element.getRootNode) {
      for (let root = element.getRootNode(); root !== document; root = root.host.getRootNode()) {
        path.push(root.host)
      }
    }

    const elementId = ids[index]

    return path.map(element => {
      const oldElementId = element.getAttribute('data-applitools-selector')
      const newElementId = oldElementId ? `${oldElementId} ${elementId}` : elementId
      element.setAttribute('data-applitools-selector', newElementId)
      return `[data-applitools-selector~='${elementId}']`
    })
  })
}

module.exports = addElementIds
