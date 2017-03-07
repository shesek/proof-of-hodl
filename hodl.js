const bcoin = require('bcoin')
    , { script: Script, opcode: Opcode, address: Address, coin: Coin, keyring: KeyRing
      , tx: TX, mtx: MTX, bn: BN, crypto: Crypto, ec: EC } = bcoin
    , { PrivateKey, PublicKey } = bcoin.hd
    , { hashType } = Script
    , { OP_CHECKSEQUENCEVERIFY, OP_DROP, OP_CHECKSIG, OP_0 } = Script.opcodes

const NETWORK = process.env.NETWORK || 'testnet'
    , FEE = 10000

const rev = str => str.match(/../g).reverse().join('')

const makePubKey = (rawKey, h) => {
  const key     = new PublicKey
  key.publicKey = rawKey
  key.depth = 0
  key.parentFingerPrint = new Buffer([0, 0, 0, 0])
  key.network   = NETWORK
  key.chainCode = h
  key.childIndex = 0
  return key
}

const deriveMsgKey = (key, msg) => {
  if (!Buffer.isBuffer(msg)) msg = new Buffer(''+msg, 'utf8')
  const h = Crypto.hmac('sha256', msg, key.toPublic().toRaw())

  return PrivateKey.isHDPrivateKey(key)
    ? PrivateKey.fromKey(EC.privateKeyTweakAdd(key.privateKey, h), h) // @FIXME h is re-used for childCode
    : makePubKey(EC.publicKeyTweakAdd(key.publicKey, h), h)
}

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

const makeUnlockTx = (coin, rlocktime, refundAddr) => TX.fromOptions({
  version: 2
, inputs: [ { prevout: coin, sequence: rlocktime } ]
, outputs: [ { address: refundAddr, value: coin.value - FEE } ]
})

const signUnlockTx = (privkey, redeemScript, tx, vin, coin) => {
  const mtx = MTX.fromTX(tx)
  mtx.inputs[vin].script = Script.fromArray([
    mtx.signature(vin, redeemScript, coin.value, privkey.privateKey, hashType.ALL, 0)
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
  const privkey      = PrivateKey.generate(NETWORK)
      , childPubkey  = deriveMsgKey(privkey, msg).toPublic()
      , redeemScript = makeEncumberScript(childPubkey, rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , address      = Address.fromScript(outputScript)

  return {
    redeemScript: redeemScript.toString()
  , address:      address.toBase58(NETWORK)
  , privkey:      privkey.toBase58(NETWORK)
  , pubkey:       privkey.toPublic().toBase58(NETWORK)
  , msg, rlocktime
  }
}

exports.unlock = ({ privkey, rlocktime, msg }, c, refundAddr) => {
  const childPrivkey = deriveMsgKey(PrivateKey.fromBase58(privkey), msg)
      , redeemScript = makeEncumberScript(childPrivkey.toPublic(), rlocktime)
      , outputScript = Script.fromScripthash(redeemScript.hash160())
      , coin         = Coin.isCoin(c) ? c : Coin.fromOptions(c)

  return signUnlockTx(childPrivkey, redeemScript, makeUnlockTx(coin, rlocktime, refundAddr), 0, coin)
}

exports.encodeProof = (tx, lockbox) => ({
  tx: Buffer.isBuffer(tx) ? tx.toString('hex') : TX.isTX(tx) ? tx.toRaw().toString('hex') : tx
, pubkey:    lockbox.pubkey
, rlocktime: lockbox.rlocktime
, msg:       lockbox.msg
})

exports.verifyProof = ({ tx: rawtx, pubkey, rlocktime, msg }) => {
  try {
    const tx = TX.isTX(rawtx) ? rawtx : TX.fromRaw(rawtx, 'hex')
        , childPubkey = deriveMsgKey(PublicKey.fromBase58(pubkey), msg)
        , { address, value } = parseLockTx(tx, rlocktime, childPubkey)
    if (value) return { value, rlocktime,  msg, pubkey, tx, address, weight: value*rlocktime }
  } catch (e) { console.error(e.stack||e) }

  return false
}
