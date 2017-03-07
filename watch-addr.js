const btcd = require('btcd')
    , iferr = require('iferr')
    , { tx: TX, coin: Coin } = require('bcoin')
    , { EventEmitter } = require('events')

const NETWORK = process.env.NETWORK || 'testnet'
    , { BTCD_URI, BTCD_CERT } = process.env

const hub = new EventEmitter

if (BTCD_URI) {
  const btcd = require('btcd')

  module.exports = (addr, cb) => {
    btcdClient().notifyreceived([ addr ], iferr(cb))
    hub.once(addr, cb)
  }

  const btcdClient = (client => _ => {
    if (!client) {
      client = btcd(process.env.BTCD_URI, process.env.BTCD_CERT)
      client.on('recvtx', (rawtx, block) => {
        const tx = TX.fromRaw(rawtx, 'hex')
        tx.outputs.forEach((out, outv) => {
          const addr = out.getAddress()
          addr && hub.emit(addr.toBase58(NETWORK), null, Coin.fromTX(tx, outv, block ? block.height : -1), tx, block)
        })
      })
    }
    return client
  })()

} else {
  const inquirer = require('inquirer')

  module.exports = (addr, cb) => {
    inquirer.prompt([
      { name: 'rawtx', message: 'the lock tx in raw hex format' }
    //, { name: 'txid', message: 'txid' }
    //, { name: 'vout', message: 'vout' }
    //, { name: 'value', message: 'value' }
    ]).then(answers => {
        const tx = TX.fromRaw(answers.rawtx.replace(/\s+/g, ''), 'hex')
        tx.outputs.some((out, outv) => {
          if (out.getAddress().toBase58(NETWORK) == addr) {
            cb(null, Coin.fromTX(tx, outv, -1), tx)
            return true
          }
        }) || cb(new Error('invalid tx'))
    })
  }
}
