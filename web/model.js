const pg = require('pg')
    , { iferr, throwerr } = require('iferr')

module.exports = _ => {
  const client = new pg.Client // uses PGUSER, PGDATABASE, PGPASSWORD, PGPORT
  client.connect(throwerr(_ => console.log('Connected to postgres')))

  const listQuestions = cb =>
    client.query('SELECT * FROM v_question ORDER BY id DESC', iferr(cb, result =>
      cb(null, result.rows)))

  const loadQuestionBySlug = (slug, cb) =>
    client.query('SELECT * FROM question WHERE slug=$1', [ slug ], iferr(cb, result =>
      !result.rows.length
      ? cb(null)
      : client.query('SELECT * FROM question_option WHERE question_id=$1', [ result.rows[0].id ], iferr(cb, oresult => {
          const question = result.rows[0]
          question.options = oresult.rows.reduce((o, opt) => (o[opt.id]=opt, o), {  })
          cb(null, question)
        }
      ))))

  const loadQuestionVotes = (question_id, cb) =>
    client.query('SELECT * FROM v_vote WHERE question_id = $1', [ question_id ], iferr(cb, result =>
      cb(null, result.rows)))

  const loadQuestionTotals = (question_id, cb) =>
    client.query('SELECT * FROM vote_totals WHERE question_id=$1', [ question_id ], iferr(cb, result =>
      cb(null, result.rows.reduce((o, t) => (o[t.option_id]=t.total, o), {}))))

  const loadRefundTxs = cb =>
    client.query('SELECT address, txid, refundtx FROM vote ORDER BY id DESC', iferr(cb, result =>
      cb(null, result.rows)
    ))

  const saveVote = (vote, cb) => (console.log(vote),
    client.query(`INSERT INTO vote (question_id, option_id, value, rlocktime, address, txid, locktx, refundtx)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
               , [ vote.question_id, vote.option_id, vote.value, vote.rlocktime, vote.address, vote.txid, vote.locktx, vote.refundtx ]
               , cb))

  return { listQuestions, loadQuestionBySlug, loadQuestionVotes, loadQuestionTotals, loadRefundTxs, saveVote }
}
