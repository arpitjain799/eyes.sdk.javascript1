exports.create = function ({userAgent}) {
  return (req, res, next) => {
    if (req.url.endsWith('.jpg')) {
      console.log('user-agent', req.headers['user-agent'])
      if (new RegExp(userAgent).test(req.headers['user-agent'])) next()
      else res.status(404).send('Not found')
    } else {
      next()
    }
  }
}
