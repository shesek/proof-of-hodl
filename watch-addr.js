const btcd = require('btcd')
    , iferr = require('iferr')
    , { tx: TX, coin: Coin } = require('bcoin')
    , { EventEmitter } = require('events')

const NETWORK = process.env.NETWORK || 'testnet'

const hub = new EventEmitter

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


module.exports = (addr, cb) => {
  btcdClient().notifyreceived([ addr ], iferr(cb))
  hub.once(addr, cb)
}
