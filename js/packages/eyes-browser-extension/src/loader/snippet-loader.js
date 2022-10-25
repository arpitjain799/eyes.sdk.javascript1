module.exports = function (source) {
  return source.replace(
    /("use strict";)/g,
    "$1arg=typeof ref !== 'undefiend'&&arg&&arg.map&&arg.map(s=>refer.isRef(s) ? refer.deref(s) : s);",
  )
}
