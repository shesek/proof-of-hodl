const moveDec = require('move-decimal-point')

const makeVoteMsg = (question, option) => [ question.id, question.text, option.id, option.text ].join('|')

const formatSatoshis = value => moveDec(value, -8)

module.exports = { makeVoteMsg, formatSatoshis }
