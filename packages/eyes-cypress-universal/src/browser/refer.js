const uuid = require('uuid');

const REF_ID = 'applitools-ref-id';
class Refer {
  constructor() {
    this.store = new Map();
    this.relation = new Map();
  }

  isRef(ref) {
    return Boolean(ref[REF_ID]);
  }

  ref(value, parentRef) {
    try {
      const ref = uuid.v4();
      this.store.set(ref, value);
      if (parentRef) {
        let childRefs = this.relation.get(parentRef[REF_ID]);
        if (!childRefs) {
          childRefs = new Set();
          this.relation.set(parentRef[REF_ID], childRefs);
        }
        childRefs.add(ref);
      }
      return {[REF_ID]: ref};
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  deref(ref) {
    if (this.isRef(ref)) {
      return this.store.get(ref[REF_ID]);
    } else {
      return ref;
    }
  }

  destroy(ref) {
    if (!this.isRef(ref)) return;
    const childRefs = this.relation.get(ref[REF_ID]);
    if (childRefs) {
      childRefs.forEach(childRef => this.destroy(childRef));
    }
    this.store.delete(ref[REF_ID]);
  }
}

module.exports = Refer;
