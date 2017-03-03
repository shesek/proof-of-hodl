const yargs = require('yargs')
    , inquirer = require('inquirer')
    , debug = require('debug')('proof-of-hodl')
    , { lock, unlock } = require('./hodl')

require('colors')

yargs
  .usage('$0 <cmd> [args]')
  .command('lock [msg]', 'create lock proof', { duration: { default: 100 } }, argv => {
    const lockbox = lock(+argv.duration, argv.msg)

    //console.log('Ephemeral private key:'.cyan, lockbox.privkey)
    debug('encumberScript:', lockbox.redeemScript)
    console.log('Please deposit funds to:'.cyan, lockbox.address)

    inquirer.prompt([
      { name: 'txid', message: 'txid' }
    , { name: 'vout', message: 'vout' }
    , { name: 'value', message: 'value' }
    , { name: 'refund_addr', message: 'refund addr' }
    ]).then(answers => {
      const coin = { txid: answers.txid, vout: +answers.vout, value: +answers.value }
          , tx = unlock(lockbox, coin, answers.refund_addr)
      console.log('tx', tx.toRaw().toString('hex'))
    })
  })
  .help()
  .argv
