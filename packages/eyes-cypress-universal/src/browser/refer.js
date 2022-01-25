const uuid = require('uuid')

const REF_ID = 'applitools-ref-id'
class Refer {
    #_store
    #_relation
    constructor() {
        this.#_store = new Map()
        this.#_relation = new Map()
    }

    isRef(ref){
        return Boolean(ref[REF_ID])
    }
    
    ref(value, parentRef) {
    try{
        const ref = uuid.v4()
        this.#_store.set(ref, value)
        if (parentRef) {
            let childRefs = this.#_relation.get(parentRef[REF_ID])
            if (!childRefs) {
            childRefs = new Set()
            this.#_relation.set(parentRef[REF_ID], childRefs)
            }
            childRefs.add(ref)
        }
        return {[REF_ID]: ref}
    } catch(ex){
        console.log(ex)
        throw ex
    }
    
    }
    
    deref(ref) {
        if (this.isRef(ref)) {
            return this.#_store.get(ref[REF_ID])
        } else {
            return ref
        }
    }
    
    destroy(ref) {
        if (!isRef(ref)) return
        const childRefs = this.#_relation.get(ref[REF_ID])
        if (childRefs) {
            childRefs.forEach(childRef => destroy(childRef))
        }
        this.#_store.delete(ref[REF_ID])
    }
}

module.exports = Refer