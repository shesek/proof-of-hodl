const makeVoteMsg = (question, option) => [ question.id, question.text, option.id, option.text ].join('|')

module.exports = { makeVoteMsg }
