const iferr      = require('iferr')
    , browserify = process.env.NODE_ENV == 'production' || require('browserify-middleware')
    , express    = require('express')
    , vagueTime  = require('vague-time')
    , watchAddr  = require('../watch-addr')
    , { verifyProof } = require('../hodl')
    , { makeVoteMsg, formatSatoshis } = require('../util')

const NETWORK = process.env.NETWORK || 'testnet'

const ADDR_WATCH_TIMEOUT = 10 * 60 * 1000

const { listQuestions, loadQuestion, loadQuestionVotes, loadQuestionTotals, loadRefundTxs, saveVote } = require('./model')()

const app = express()

app.set('port', process.env.PORT || 5656)
app.set('url', process.env.URL || `http://localhost:${ app.settings.port }`)
app.set('static_url', process.env.STATIC_URL || app.settings.url)
app.set('view engine', 'pug')
app.set('views', __dirname + '/views')

app.locals.formatSatoshis = formatSatoshis
app.locals.vague = time => vagueTime.get({ to: time })
app.locals.round = require('round')

app.use(express.static(__dirname + '/static'))
app.use(require('morgan')('dev'))
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: false }))

app.param('question', (req, res, next, id) =>
  loadQuestion(id, iferr(next, question => question
    ? (req.question = res.locals.question = question, next())
    : res.sendStatus(404)
  )))

app.param('option', (req, res, next, id) =>
  req.question.options[id]
  ? (req.question_option = req.question.options[id], next())
  : res.sendStatus(404)
)

if (app.settings.env != 'production') {
    app.get('/script.js', browserify(__dirname + '/client.js'))
}

app.get('/', (req, res, next) => listQuestions(iferr(next, questions => res.render('index', { questions }))))

app.get('/wait/:addr', (req, res, next) => {
  watchAddr(req.params.addr, iferr(next, (coin, tx, block) =>
      res.headersSent || res.send({ coin, tx: tx.toRaw().toString('hex'), block })))
  setTimeout(_ => res.headersSent || res.sendStatus(402), ADDR_WATCH_TIMEOUT)
})

app.get('/q/:question', (req, res, next) =>
  loadQuestionTotals(req.question.id, iferr(next, totals =>
    loadQuestionVotes(req.question.id, iferr(next, votes =>
      res.render('question', { totals, votes })
    ))
  ))
)

app.post('/q/:question/:option/vote', (req, res, next) => {
  const { tx: rawtx, pubkey, rlocktime } = req.body
      , msg = makeVoteMsg(req.question, req.question_option)

  try { var { tx: locktx, value, address } = verifyProof({ tx: rawtx, pubkey, rlocktime, msg }) }
  catch (err) { console.error(err); return res.sendStatus(400) }

  saveVote({
    question_id: req.question.id
  , option_id: req.question_option.id
  , value: value
  , rlocktime: rlocktime
  , address: address.toBase58(NETWORK)
  , refundtx: new Buffer(req.body.refundtx, 'hex') // @XXX verify
  , locktx: locktx.toRaw()
  , txid:   locktx.txid() // @TODO vout too
  ,
  }, iferr(next, _ => res.send(201)))
})

app.get('/txs.txt', (req, res, next) => {
  loadRefundTxs(iferr(next, votes => {
    res.type('text/plain')
       .send(votes.map(v => [ v.address, v.txid.toString('hex'), v.refundtx.toString('hex') ].join(',')).join('\n'))
  }))
})

app.listen(app.settings.port, _ => console.log(`HTTP server listening on port ${ app.get('port') }`))
