#!/usr/bin/env node

const round = require('round')
    , debug = require('debug')('proof-of-hodl')
    , inquirer = require('inquirer')
    , TX       = require('bcoin/lib/primitives/tx')
    , Coin     = require('bcoin/lib/primitives/coin')
    , { iferr, throwerr } = require('iferr')
    , { lock, unlock, encodeProof, verifyProof } = require('./hodl')
    , { formatSatoshis } = require('./util')

const NETWORK = process.env.NETWORK || 'testnet'

require('colors')

const promptCoin = (addr, cb) =>
  inquirer.prompt([{ name: 'rawtx', message: 'the lock tx in raw hex format' }])
    .then(answers => {
      const tx = TX.fromRaw(answers.rawtx.replace(/\s+/g, ''), 'hex')
      tx.outputs.some((out, outv) =>
        out.getAddress().toBase58(NETWORK) == addr
          ? (cb(null, Coin.fromTX(tx, outv, -1), tx), true)
          : false
        ) || cb(new Error('invalid tx'))
    })

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

    console.log('ephemeral private key: ', lockbox.privkey)
    console.log('redeemScript:', lockbox.redeemScript)
    console.log('\nDeposit funds to:'.cyan.bold, lockbox.address)

    promptCoin(lockbox.address, throwerr((coin, tx) => {
      const refundTx = unlock(lockbox, coin, argv.refund)
          , proof = encodeProof(tx, lockbox)
      printBDL(coin.value, lockbox.rlocktime)
      console.log('- %s %s', 'refund tx:'.cyan.bold, refundTx.toRaw().toString('hex'))
      console.log('- %s %s', 'proof:'.cyan.bold, JSON.stringify(proof))
      process.exit()
    }))
  })

  .command('verify [proof]', 'verify proof', {}, argv => {
    const p = verifyProof(JSON.parse(argv.proof))
    if (p) {
      console.log('- %s %s\n  '+'(NOTE: this proof is only valid if this txid is mined!)'.red, 'lock txid:'.cyan.bold, p.tx.txid())
      console.log('- %s %s', 'address:'.cyan.bold, p.address)
      printBDL(p.value, p.rlocktime, p.weight)
      console.log('- %s %s', 'msg:'.cyan.bold, p.msg)
    } else {
      console.log('invalid proof!'.red.bold)
    }
  })

  .help()

, argv = yargs.argv

argv._.length || yargs.showHelp()
