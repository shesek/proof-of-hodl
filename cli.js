#!/usr/bin/env node

const round = require('round')
    , debug = require('debug')('proof-of-hodl')
    , { iferr, throwerr } = require('iferr')
    , { lock, unlock, makeProof, verifyProof } = require('./hodl')
    , { formatSatoshis } = require('./util')
    , watchAddr = require('./watch-addr')

require('colors')

const printBDL = (value, rlocktime, weight=value*rlocktime) =>
  console.log('- %s %s BTC x %s days = %s (%s satoshi-blocks)', 'value:'.cyan.bold
  , formatSatoshis(value)
  , round(rlocktime/144, 0.0001)
  , (round(+formatSatoshis(weight/144), 0.00001) + ' BDL').green
  , weight)

const yargs = require('yargs')
  .usage('$0 <cmd> [args]')
  .command('lock [msg]', 'create lock proof', {
    duration: { required: true, alias: 'd', describe: 'lock duration in number of blocks' }
  , refund: { required: true, alias: 'r', describe: 'refund address' }
  }, argv => {
    const lockbox = lock(+argv.duration, ''+argv.msg)

    debug('ephemeral private key:'.cyan, lockbox.privkey)
    debug('encumberScript:', lockbox.redeemScript)
    console.log('Deposit funds to:'.cyan.bold, lockbox.address)

    watchAddr(lockbox.address, throwerr((coin, tx) => {
      const refundTx = unlock(lockbox, coin, argv.refund)
          , proof = makeProof(tx, lockbox)
      printBDL(coin.value, lockbox.rlocktime)
      console.log('- %s %s', 'refund tx:'.cyan.bold, refundTx.toRaw().toString('hex'))
      console.log('- %s %s', 'proof:'.cyan.bold, JSON.stringify(proof))
      process.exit()
    }))
  })

  .command('verify [proof]', 'verify proof', {}, argv => {
    const proof = JSON.parse(argv.proof)
        , { txid, value, rlocktime, weight, address, msg } = verifyProof(proof)
    if (value) {
      console.log(typeof txid)
      console.log('- %s %s\n  '+'(NOTE: this proof is only valid if this txid is mined!)'.red, 'lock txid:'.cyan.bold, txid)
      console.log('- %s %s', 'address:'.cyan.bold, address)
      printBDL(value, rlocktime, weight)
      console.log('- %s %s', 'msg:'.cyan.bold, msg)
    } else {
      console.log('invalid proof!'.red.bold)
    }
  })

  .help()

, argv = yargs.argv

argv._.length || yargs.showHelp()
