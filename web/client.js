/*import Rx, { Observable as O } from 'rx'
import { run } from '@cycle/rx-run'
import io from 'socket.io-client'
import { makeDOMDriver, button, a, h } from '@cycle/dom'
import { makeSocketDriver, dbgStreams } from './util'

const main = ({ DOM, socket }) => {
  const vote$ = DOM.select('[data-vote]').events('click').map(e => e.target.getAttribute('data-vote'))
}*/

const request = require('superagent')
    , qruri = require('qruri')
    , round = require('round')
    , { coin: Coin, amount: Amount } = require('bcoin')
    , { throwerr } = require('iferr')
    , { lock, unlock } = require('../hodl')
    , { makeVoteMsg, formatSatoshis } = require('../util')

const voteDialog    = require('./views/vote-dialog.pug')
const payDialog     = require('./views/pay-dialog.pug')
const successDialog = require('./views/success-dialog.pug')

const question  = JSON.parse($('meta[name=question]').attr('content'))

$('[data-vote]').click(e => {
  e.preventDefault()
  $(voteDialog({ question, option_id: $(e.target).data('vote') })).modal()
})

$(document.body).on('submit', 'form[data-question]', e => {
  e.preventDefault()
  $('.vote-dialog').modal('hide')

  const form      = $(e.target)

      , amount    = +form.find('[name=amount]').val()
      , dur_type  = form.find('[name=duration_type]').val()
      , duration  = +form.find('[name=duration]').val()
      , rlocktime = dur_type == 'days' ?0|duration*144 : duration
      , refund    = +form.find('[name=refund_addr]').val()
      , option_id = form.find('[name=answer]').val()
      , option    = question.options[option_id]
      , weight    = amount * rlocktime

      , msg       = makeVoteMsg(question, option)
      , lockbox   = lock(rlocktime, msg)

      , pay_uri   = `bitcoin:${ lockbox.address  }?amount=${ amount }`
      , pay_qr    = qruri(pay_uri)

  console.log(lockbox)

  const dialog = $(payDialog({ question, option_id, amount, weight, lockbox, pay_qr, round })).modal()

  request('/wait/'+lockbox.address, throwerr(res => {
    if (!res.ok) return alert('payment time out')

    const coin     = Coin.fromJSON(res.body.coin)
        , locktx   = res.body.tx
        , weight   = round(+formatSatoshis(coin.value * lockbox.rlocktime), 0.00001)
        , amount   = Amount.btc(coin.value)
        , refundtx = unlock(lockbox, coin, refund)
        , rawtx    = refundtx.toRaw().toString('hex')

    dialog.modal('hide').remove()

    $(successDialog({ question, option_id, coin, amount, weight, lockbox, rawtx, round })).modal()

    request.post(`/q/${ question.id }/${ option.id }/vote`)
      .send({ tx: locktx, pubkey: lockbox.pubkey, rlocktime: lockbox.rlocktime, refundtx: rawtx })
      .end(throwerr(res => console.log('got reply', res.body)))
  }))

})

