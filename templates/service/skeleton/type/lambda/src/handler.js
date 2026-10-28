'use strict'
// Lambda thin skeleton (maturity: thin).
exports.handler = async (event) => {
  if (event.path === '/health' || event.rawPath === '/health') {
    return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
  }
  return { statusCode: 200, body: JSON.stringify({ message: 'Hello from ${{ values.serviceName }}' }) }
}
