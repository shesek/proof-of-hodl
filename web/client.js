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
    , { coin: Coin, amount: Amount } = require('bcoin')
    , { throwerr } = require('iferr')
    , { lock, unlock } = require('../hodl')

const payDialog     = require('./views/pay-dialog.pug')
const successDialog = require('./views/success-dialog.pug')

$('form[data-question]').submit(e => {
  e.preventDefault()
  const form      = $(e.target)
      , question  = form.data('question')

      , amount    = +form.find('[name=amount]').val()
      , dur_type  = form.find('[name=duration_type]').val()
      , duration  = +form.find('[name=duration]').val()
      , rlocktime = dur_type == 'days' ?0|duration*144 : duration
      , refund    = +form.find('[name=refund_addr]').val()
      , option_id = form.find('[name=answer]').val()
      , weight    = amount * rlocktime

      , msg       = JSON.stringify([ question, option_id ])
      , lockbox   = lock(rlocktime, msg)

      , pay_uri   = `bitcoin:${ lockbox.address  }?amount=${ amount }`
      , pay_qr    = qruri(pay_uri)

  console.log(lockbox)

  const dialog = $(payDialog({ question, option_id, amount, weight, lockbox, pay_qr })).modal()

  request('/wait/'+lockbox.address, throwerr(res => {
    if (!res.ok) return alert('payment time out')
    const coin   = Coin.fromJSON(res.body.coin)
        , weight = (coin.value * lockbox.rlocktime / 100000000).toFixed(2)
        , amount = Amount.btc(coin.value)
        , tx     = unlock(lockbox, coin, refund)

    dialog.modal('hide').remove()

    $(successDialog({ question, option_id, coin, amount, weight, lockbox, rawtx: tx.toRaw().toString('hex') })).modal()
    console.log('tx', tx.toRaw().toString('hex'))
  }))

})

