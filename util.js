const moveDec = require('move-decimal-point')

const formatSatoshis = value => moveDec(value, -8)

module.exports = { formatSatoshis }
