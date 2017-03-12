const pg = require('pg')
    , { iferr, throwerr } = require('iferr')

module.exports = _ => {
  const client = new pg.Client // uses PGUSER, PGDATABASE, PGPASSWORD, PGPORT
  client.connect(throwerr(_ => console.log('Connected to postgres')))

  client.query = (query => (...a) => (console.log('query',a),query.apply(client,a)   ))(client.query)

  const listQuestions = cb =>
    client.query('SELECT id, slug, text, total_bdl FROM v_question ORDER BY total_bdl DESC', iferr(cb, result =>
      cb(null, result.rows)))

  const loadQuestionBySlug = (slug, cb) =>
    client.query('SELECT * FROM v_question WHERE slug=$1', [ slug ], iferr(cb, result =>
      cb(null, result.rows[0])
      ))

  const loadQuestionVotes = (question_id, cb) =>
    client.query('SELECT * FROM v_vote WHERE question_id = $1', [ question_id ], iferr(cb, result =>
      cb(null, result.rows)))

  const loadRefundTxs = cb =>
    client.query('SELECT address, txid, refundtx FROM vote ORDER BY id DESC', iferr(cb, result =>
      cb(null, result.rows)
    ))

  const saveVote = (vote, cb) =>
    client.query(`INSERT INTO vote (question_id, option_id, value, rlocktime, pubkey, address, txid, locktx, refundtx)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
               , [ vote.question_id, vote.option_id, vote.value, vote.rlocktime, vote.pubkey, vote.address, vote.txid, vote.locktx, vote.refundtx ]
               , cb)

  return { listQuestions, loadQuestionBySlug, loadQuestionVotes, loadRefundTxs, saveVote }
}
