const { tx: TX, coin: Coin } = require('bcoin')
    , iferr = require('iferr')
    , { EventEmitter } = require('events')

const NETWORK = process.env.NETWORK || 'testnet'

const hub = new EventEmitter
    , btcd = require('btcd')(process.env.BTCD_URI, process.env.BTCD_CERT)


btcd.on('recvtx', (rawtx, block) => {
  const tx = TX.fromRaw(rawtx, 'hex')
  tx.outputs.forEach((out, outv) => {
    const addr = out.getAddress()
    addr && hub.emit(addr.toBase58(NETWORK), null, Coin.fromTX(tx, outv, block ? block.height : -1), tx, block)
  })
})

module.exports = (addr, cb) => {
  btcd.notifyreceived([ addr ], iferr(cb))
  hub.once(addr, cb)
}
