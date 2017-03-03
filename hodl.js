const debug = require('debug')('proof-of-hodl')
    , bcoin = require('bcoin')
    , { script: Script, opcode: Opcode, address: Address, coin: Coin, tx: TX, mtx: MTX } = bcoin
    , { PrivateKey } = bcoin.hd
    , { OP_CHECKSEQUENCEVERIFY, OP_DROP, OP_CHECKSIG } = Script.opcodes

const NETWORK = process.env.NETWORK || 'testnet'

const H = x => 123 // @TODO

const makeEncumberScript = (pubkey, rlocktime) => Script.fromArray([
  rlocktime
, OP_CHECKSEQUENCEVERIFY
, OP_DROP
, pubkey.publicKey
, OP_CHECKSIG
])

const makeUnlockTx = (coin, redeemScript, rlocktime, refundAddr) => TX.fromOptions({
  inputs: [ { prevout: coin, sequence: rlocktime, script: [ redeemScript.toRaw() ] } ]
, outputs: [ { address: refundAddr, value: coin.value } ]
})

const signUnlockTx = (privkey, tx) => {
  const mtx = MTX.fromTX(tx)
  mtx.sign(privkey)
  return mtx.toTX()
}

const deriveMsgKey = (key, msg) => key.derive(H(msg))

exports.lock = (rlocktime, msg) => {
  debug('lock(%d, %s)', rlocktime, msg)
  const privkey = PrivateKey.generate(NETWORK)
      , mpubkey = deriveMsgKey(privkey, msg).toPublic()
      , redeemScript = makeEncumberScript(mpubkey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , address = Address.fromScript(outputScript)

  return {
    redeemScript: redeemScript.toString()
  , address: address.toBase58(NETWORK)
  , privkey: privkey.toBase58(NETWORK)
  , msg, rlocktime
  }
}

exports.unlock = ({ privkey, rlocktime, msg }, { txid, vout, value }, refundAddr) => {
  const mprivkey = deriveMsgKey(PrivateKey.fromBase58(privkey), msg)
      , redeemScript = makeEncumberScript(mprivkey.toPublic(), rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , coin = Coin.fromOptions({ hash: txid, index: vout, script: outputScript, value })

  return signUnlockTx(mprivkey, makeUnlockTx(coin, redeemScript, rlocktime, refundAddr))
}
