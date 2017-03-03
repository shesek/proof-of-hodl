const yargs = require('yargs')
    , debug = require('debug')('proof-of-hodl')
    , { lock, unlock } = require('./hodl')

    , argv = require('yargs').argv

//yargs
  //.usage('$0 <cmd> [args]')
  //.command('makelock [rlocktime] [msg]', 'make hodl lockbox', { rlocktime: {}, msg: {} }, argv => {

//console.log('argv', argv)

const lockbox = lock(+argv.rlocktime, argv.msg)
console.log('lockbox', lockbox)

const coin = { txid: argv.txid, vout: argv.vout, value: argv.value }

const tx = unlock(lockbox, coin, argv.refund_addr)

console.log('tx', tx.toRaw().toString('hex'))
