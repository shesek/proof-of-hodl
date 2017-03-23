const Address = require('bcoin/lib/primitives/address')
    , KeyRing = require('bcoin/lib/primitives/keyring')
    , Crypto  = require('bcoin/lib/crypto')
    , Opcode  = require('bcoin/lib/script/opcode')
    , Script  = require('bcoin/lib/script/script')
    , Coin    = require('bcoin/lib/primitives/coin')
    , MTX     = require('bcoin/lib/primitives/mtx')
    , TX      = require('bcoin/lib/primitives/tx')
    , EC      = require('bcoin/lib/crypto/ec')
    , HD      = require('bcoin/lib/hd')
    , BN      = require('bn.js')
    , { hashType } = Script
    , { OP_CHECKSEQUENCEVERIFY, OP_DROP, OP_CHECKSIG, OP_0 } = Script.opcodes

const NETWORK = process.env.NETWORK || 'testnet'
    , FEE     = 10000

const deriveMsgKey = (key, msg) => {
  Buffer.isBuffer(msg) || (msg = new Buffer(''+msg, 'utf8'))
  const h = Crypto.hmac('sha256', msg, key.publicKey)

  return KeyRing.fromKey(key.privateKey
                         ? EC.privateKeyTweakAdd(key.privateKey, h)
                         : EC.publicKeyTweakAdd(key.publicKey, h)
                       , NETWORK)
}

const makeEncumberScript = (pubkey, rlocktime) => {
  const script = new Script
  script.push(pubkey)
  script.push(OP_CHECKSIG)
  script.push(new BN(rlocktime))
  script.push(OP_CHECKSEQUENCEVERIFY)
  script.push(OP_DROP)
  script.compile()
  return script
}

const makeUnlockTx = (coin, rlocktime, refundAddr) => TX.fromOptions({
  version: 2
, inputs: [ { prevout: coin, sequence: rlocktime } ]
, outputs: [ { address: refundAddr, value: coin.value - FEE } ]
})

const signUnlockTx = (privkey, redeemScript, tx, vin, coin) => {
  const mtx = MTX.fromTX(tx)
  mtx.inputs[vin].script = Script.fromArray([
    mtx.signature(vin, redeemScript, coin.value, privkey, hashType.ALL, 0)
  , redeemScript.toRaw()
  ])
  return mtx.toTX()
}

const parseLockTx = (tx, rlocktime, pubkey) => {
  const redeemScript = makeEncumberScript(pubkey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , address      = Address.fromScript(outputScript).toBase58(NETWORK)
      , value        = tx.outputs.reduce((total, out) =>
          address === Address.fromScript(out.script).toBase58(NETWORK)
            ? total + out.value
            : total
        , 0)

  return { address, value }
}

exports.lock = (rlocktime, msg) => {
  const parentKey    = KeyRing.generate(NETWORK)
      , childkey     = deriveMsgKey(parentKey, msg)
      , redeemScript = makeEncumberScript(childkey.publicKey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , address      = Address.fromScript(outputScript)

  return {
    redeemScript: redeemScript.toString()
  , address:      address.toBase58(NETWORK)
  , privkey:      parentKey.toSecret()
  , pubkey:       parentKey.publicKey.toString('hex')
  , msg, rlocktime
  }
}

exports.unlock = ({ privkey, rlocktime, msg }, c, refundAddr) => {
  const childKey     = deriveMsgKey(KeyRing.fromSecret(privkey), msg)
      , redeemScript = makeEncumberScript(childKey.publicKey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , coin         = Coin.isCoin(c) ? c : Coin.fromOptions(c)

  return signUnlockTx(childKey.privateKey, redeemScript, makeUnlockTx(coin, rlocktime, refundAddr), 0, coin)
}

exports.encodeProof = (tx, lockbox) => ({
  tx: Buffer.isBuffer(tx) ? tx.toString('hex') : TX.isTX(tx) ? tx.toRaw().toString('hex') : tx
, pubkey:    lockbox.pubkey
, rlocktime: lockbox.rlocktime
, msg:       lockbox.msg
})

exports.verifyProof = ({ tx: _tx, pubkey, rlocktime, msg }) => {
  try {
    const tx = TX.fromRaw(_tx, 'hex')
        , parentKey = KeyRing.fromPublic(new Buffer(pubkey, 'hex'), NETWORK)
        , childKey  = deriveMsgKey(parentKey, msg)
        , { address, value } = parseLockTx(tx, rlocktime, childKey.publicKey)
    if (value) return { value, rlocktime,  msg, pubkey, tx, address, weight: value*rlocktime }
  } catch (e) { console.error(e.stack||e) }

  return false
}
