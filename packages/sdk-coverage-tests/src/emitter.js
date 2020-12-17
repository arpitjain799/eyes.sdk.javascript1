function useEmitter() {
  const o = {}
  const syntax = new Proxy(o, {
    get(target, key) {
      if (key in target) return Reflect.get(target, key)
      throw new Error(
        `EmitTracker don't have an implementation for "${key}" syntax. Use ".addSyntax('${key}', <impl>)" method to add an implementation`,
      )
    },
  })
  const hooks = {deps: [], vars: [], beforeEach: [], afterEach: []}
  const commands = []

  return [
    {hooks, commands},
    {useRef, useSyntax, withScope, addSyntax, addHook, addCommand},
  ]

  function withScope(logic, scope = []) {
    return () => logic(...scope.map(name => useRef(name)))
  }

  function useRef(deref) {
    const ref = function() {}
    ref.isRef = true
    ref.ref = function(name) {
      if (name) {
        ref._name = name
        return this
      } else if (ref._isResolved) {
        return ref._name
      } else {
        ref._name = typeof deref === 'function' ? deref({type: ref._type, name: ref._name}) : deref
        ref._isResolved = true
        return ref._name
      }
    }
    ref.type = function(type) {
      if (type) {
        if (typeof type === 'string') ref._type = parseType(type)
        else if (typeof type.type === 'string') {
          ref._type = {...type, ...parseType(type.type)}
        } else {
          ref._type = type
        }
        return this
      } else {
        return ref._type
      }
    }
    return new Proxy(ref, {
      get(ref, key) {
        if (key in ref) return Reflect.get(ref, key)
        const type = ref.type()
        const result = useRef(() => syntax.getter({type, target: ref.ref(), key}))
        if (type) {
          console.log(type)
          if (type.recursive) result.type(type)
          else if (type.items) result.type(type.items)
          else if (type.schema && type.schema[key]) result.type(type.schema[key])
        }
        return result
      },
      apply(ref, _, args) {
        return useRef(() => syntax.call({target: ref.ref(), args: Array.from(args)}))
      },
    })
  }

  function addSyntax(name, callback) {
    syntax[name] = callback
  }

  function useSyntax(name, data) {
    return syntax[name](data)
  }

  function addCommand(command) {
    if (Array.isArray(command)) {
      const [result] = command.map(command => {
        if (typeof command === 'function') {
          const result = command()
          if (result && result.isRef) {
            addCommand(syntax.return({value: result.ref(), type: result.type()}))
          }
        } else {
          return addCommand(command)
        }
      })
      return result
    }
    const id = commands.push(typeof command === 'function' ? command() : command)
    return useRef(({name = `var_${id}`, type} = {}) => {
      const value = commands[id - 1]
      commands[id - 1] = syntax.var({constant: true, name, value, type})
      return name
    })
  }

  function addHook(name, value) {
    switch (name) {
      case 'deps':
      case 'vars':
      case 'beforeEach':
      case 'afterEach':
        return hooks[name].push(value)
      default:
        throw new Error(
          `Unsupported hook ${name}. Please specify one of either ${Object.keys(hooks).join(', ')}`,
        )
    }
  }

  function parseType(type) {
    const match = type.match(/(?<name>[A-Za-z][A-Za-z0-9_]*)(<(?<generic>.*)>)?/)
    if (!match) {
      throw new Error(
        'Type format is incorrect. Please follow the convention (e.g. TypeName or Type1<Type2, Type3>)',
      )
    }
    return {
      name: match.groups.name,
      generic: match.groups.generic ? match.groups.generic.split(/, ?/).map(parseType) : null,
    }
  }
}

function withHistory(groups) {
  const history = []
  const emitters = Object.entries(groups).reduce((emitters, [name, commands]) => {
    return Object.assign(emitters, {[name]: wrapCommand(name, commands)})
  }, {})
  return [history, emitters]

  function wrapCommand(name, commands) {
    return new Proxy(commands, {
      get(target, key) {
        return wrapCommand(`${name}.${key}`, Reflect.get(target, key))
      },
      apply(target, thisArg, args) {
        const result = Reflect.apply(target, thisArg, args)
        history.push({name, args, result})
        return result
      },
    })
  }
}

exports.useEmitter = useEmitter
exports.withHistory = withHistory
