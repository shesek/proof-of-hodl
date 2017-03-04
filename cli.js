const yargs = require('yargs')
    , inquirer = require('inquirer')
    , debug = require('debug')('proof-of-hodl')
    , { iferr, throwerr } = require('iferr')
    , { lock, unlock, makeProof, verifyProof } = require('./hodl')
    , watchAddr = require('./watch-addr')


require('colors')

yargs
  .usage('$0 <cmd> [args]')
  .command('lock [msg]', 'create lock proof', { duration: { required: true }, refund: { required: true  } }, argv => {
    const lockbox = lock(+argv.duration, argv.msg)

    //console.log('Ephemeral private key:'.cyan, lockbox.privkey)
    debug('encumberScript:', lockbox.redeemScript)
    console.log('Please deposit funds to:'.cyan, lockbox.address)

    watchAddr(lockbox.address, throwerr((coin, tx) => {
      const refundTx = unlock(lockbox, coin, argv.refund)
      console.log('Refund tx, keep this!'.red, refundTx.toRaw().toString('hex'))

      const proof = makeProof(tx, lockbox)
      console.log('Proof', JSON.stringify(proof))

      console.log('Verify', verifyProof(proof))
    }))
  })
  .help()
  .argv
