const pg = require('pg')
    , { iferr, throwerr } = require('iferr')

module.exports = _ => {
  const client = new pg.Client // uses PGUSER, PGDATABASE, PGPASSWORD, PGPORT
  client.connect(throwerr(_ => console.log('Connected to postgres')))

  const listQuestions = cb =>
    client.query('SELECT * FROM question', iferr(cb, result =>
      cb(null, result.rows)))

  const loadQuestion = (id, cb) =>
    client.query('SELECT * FROM question WHERE id=$1', [ id ], iferr(cb, result =>
      !result.rows.length
      ? cb(null)
      : client.query('SELECT * FROM question_option WHERE question_id=$1', [ id ], iferr(cb, oresult => {
          const question = result.rows[0]
              , options  = question.options = {}
          oresult.rows.forEach(option => options[option.id]=option)
          cb(null, question)
        }
      ))))

  const saveVote = (vote, cb) =>
    client.query(`INSERT INTO vote (question_id, option_id, value, rlocktime, address, txid, locktx, refundtx)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
               , [ vote.question_id, vote.option_id, vote.value, vote.rlocktime, vote.address, vote.txid, vote.locktx, vote.refundtx ]
               , cb)

  return { listQuestions, loadQuestion, saveVote }
}
