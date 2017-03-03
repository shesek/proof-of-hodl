const iferr = require('iferr')

const votes = require('./votes.json')

const loadVote = (id, cb) => cb(null, votes[id])

const app = require('express')()

app.set('port', process.env.PORT || 5656)
app.set('view engine', 'pug')
app.set('views', __dirname + '/views')

app.locals.votes = votes

app.param('vote', (req, res, next, id) =>
  loadVote(id, iferr(next, vote => vote
    ? (req.vote = res.locals.vote = vote, next())
    : res.sendStatus(404)
  )))

app.get('/', (req, res) => res.render('index'))

app.get('/:vote', (req, res, next) => res.render('vote'))

app.listen(app.get('port'), _ => console.log(`HTTP server listening on port ${ app.get('port') }`))
