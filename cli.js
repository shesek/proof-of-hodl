const yargs = require('yargs')
    , inquirer = require('inquirer')
    , debug = require('debug')('proof-of-hodl')
    , { iferr, throwerr } = require('iferr')
    , { lock, unlock } = require('./hodl')
    , watchAddr = require('./watch-addr')


require('colors')

yargs
  .usage('$0 <cmd> [args]')
  .command('lock [msg]', 'create lock proof', { duration: { required: true }, refund: { required: true  } }, argv => {
    const lockbox = lock(+argv.duration, argv.msg)

    //console.log('Ephemeral private key:'.cyan, lockbox.privkey)
    debug('encumberScript:', lockbox.redeemScript)
    console.log('Please deposit funds to:'.cyan, lockbox.address)

    watchAddr(lockbox.address, coin => {
      const tx = unlock(lockbox, coin, argv.refund)
      console.log('Refund tx, keep this!'.red, tx.toRaw().toString('hex'))
    })
  })
  .help()
  .argv
