const iferr      = require('iferr')
    , browserify = require('browserify-middleware')
    , express    = require('express')
    , watchAddr  = require('../watch-addr')

const ADDR_WATCH_TIMEOUT = 10 * 60 * 1000

const { listQuestions, loadQuestion, saveVote } = require('./model')()

const app = express()

app.set('port', process.env.PORT || 5656)
app.set('url', process.env.URL || `http://localhost:${ app.settings.port }`)
app.set('view engine', 'pug')
app.set('views', __dirname + '/views')


app.use(express.static(__dirname + '/static'))
app.use(require('morgan')('dev'))

app.param('question', (req, res, next, id) =>
  loadQuestion(id, iferr(next, question => question
    ? (req.question = res.locals.question = question, next())
    : res.sendStatus(404)
  )))

app.get('/script.js', browserify(__dirname + '/client.js'))

app.get('/', (req, res, next) => listQuestions(iferr(next, questions => res.render('index', { questions }))))
app.get('/:question', (req, res, next) => res.render('question'))

app.get('/wait/:addr', (req, res, next) => {
  watchAddr(req.params.addr, iferr(next, (coin, tx, block) => res.send({ coin, tx, block })))
  setTimeout(_ => res.headersSent || res.sendStatus(402), ADDR_WATCH_TIMEOUT)
})

app.listen(app.settings.port, _ => console.log(`HTTP server listening on port ${ app.get('port') }`))
