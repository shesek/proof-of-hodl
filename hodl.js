const debug = require('debug')('proof-of-hodl')
    , bcoin = require('bcoin')
    , { script: Script, opcode: Opcode, address: Address, coin: Coin, keyring: KeyRing, tx: TX, mtx: MTX, bn: BN } = bcoin
    , { PrivateKey } = bcoin.hd
    , { hashType } = Script
    , { OP_CHECKSEQUENCEVERIFY, OP_DROP, OP_CHECKSIG, OP_0 } = Script.opcodes

const NETWORK = process.env.NETWORK || 'testnet'
    , FEE = 10000

const H = x => 123 // @XXX

const rev = str => str.match(/../g).reverse().join('')

const makeEncumberScript = (pubkey, rlocktime) => {
  const script = new Script
  script.push(pubkey.publicKey)
  script.push(OP_CHECKSIG)
  script.push(new BN(rlocktime))
  script.push(OP_CHECKSEQUENCEVERIFY)
  script.push(OP_DROP)
  script.compile()
  return script
}

const makeUnlockTx = (coin, redeemScript, rlocktime, refundAddr) => TX.fromOptions({
  version: 2
, inputs: [ { prevout: coin, sequence: rlocktime, script: [ OP_0, redeemScript.toRaw() ] } ]
, outputs: [ { address: refundAddr, value: coin.value - FEE } ]
})

const signUnlockTx = (privkey, redeemScript, tx, vin, coin) => {
  const mtx = MTX.fromTX(tx)
      , inScript = mtx.inputs[vin].script
      , sig = mtx.signature(vin, inScript.getRedeem(), coin.value, privkey.privateKey, hashType.ALL, 0)
  inScript.set(0, sig)
  inScript.compile()
  return mtx.toTX()
}

const deriveMsgKey = (key, msg) => key.derive(H(msg))

exports.lock = (rlocktime, msg) => {
  debug('lock(%d, %s)', rlocktime, msg)
  const privkey      = PrivateKey.fromSeed(new Buffer('001100110011001100119906')) // generate(NETWORK) // @XXX
      , mpubkey      = deriveMsgKey(privkey, msg).toPublic()
      , redeemScript = makeEncumberScript(mpubkey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , address      = Address.fromScript(outputScript)

  return {
    redeemScript: redeemScript.toString()
  , address:      address.toBase58(NETWORK)
  , privkey:      privkey.toBase58(NETWORK)
  , msg, rlocktime
  }
}

exports.unlock = ({ privkey, rlocktime, msg }, { txid, vout, value }, refundAddr) => {
  const mprivkey     = deriveMsgKey(PrivateKey.fromBase58(privkey), msg)
      , redeemScript = makeEncumberScript(mprivkey.toPublic(), rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , coin         = Coin.fromOptions({ hash: rev(txid), index: vout, script: outputScript, value })

  return signUnlockTx(mprivkey, redeemScript, makeUnlockTx(coin, redeemScript, rlocktime, refundAddr), 0, coin)
}
