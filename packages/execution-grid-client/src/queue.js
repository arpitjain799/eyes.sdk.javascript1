class Queue {
  constructor() {
    this.q = []
  }
  size() {
    return this.q.length
  }
  add(item) {
    this.q.push(item)
  }
  remove() {
    return this.q.shift()
  }
}

module.exports = Queue
