import { Psbt, initEccLib, networks, payments, script } from "bitcoinjs-lib";
import { LEAF_VERSION_TAPSCRIPT } from "bitcoinjs-lib/src/payments/bip341";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { Taptree } from "bitcoinjs-lib/src/types";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";

initEccLib(tinysecp);
const ECPair = ECPairFactory(tinysecp);
const network = networks.regtest;

const privateKey =
  "1f6de67794fe0b09d2e18b3fb3bee41c2465360eddbc368c8de256618b0c4c72";
const keypair = ECPair.fromPrivateKey(Buffer.from(privateKey, "hex"), {
  network,
});
const scriptAsm1 = `${toXOnly(keypair.publicKey).toString("hex")} OP_CHECKSIG`;
const scriptAsm2 = `OP_ADD OP_5 OP_EQUAL`;
const scriptBuffer1 = script.fromASM(scriptAsm1);
const scriptBuffer2 = script.fromASM(scriptAsm2);

const scriptTree: Taptree = [
  {
    output: scriptBuffer1,
  },
  {
    output: scriptBuffer2,
  },
];

const redeem = {
  output: scriptBuffer1,
  redeemVersion: LEAF_VERSION_TAPSCRIPT,
};
const p2tr = payments.p2tr({
  internalPubkey: toXOnly(keypair.publicKey),
  scriptTree,
  network,
  redeem,
});

if (!p2tr.witness || !p2tr.output) {
  throw new Error("witness and output is required");
}
const controlBlock = p2tr.witness[p2tr.witness.length - 1];
const scriptPubkey = p2tr.output;

const psbt = new Psbt({ network });
const txid = "9d22bc466124b755ad70420f2d84e1da3e1a914ba3bc76c553ef6d83a8c50e3c";
const vout = 0;
const utxoValue = 1000e4;
const fee = 1000;
psbt.addInput({
  hash: txid,
  index: vout,
  witnessUtxo: { value: utxoValue, script: scriptPubkey },
  tapLeafScript: [
    {
      leafVersion: redeem.redeemVersion,
      script: redeem.output,
      controlBlock,
    },
  ],
});

psbt.addOutput({
  address: "bcrt1qxh0kt0ue3tgk93u8z02elmfgkx9m57rlwahd30",
  value: (utxoValue - fee) / 2,
});
psbt.addOutput({
  address: "bcrt1pcmd8kqe47vcwvf43saanma4dv5tuz2xwywwnc3884zwy7ehql2jsemj47h",
  value: (utxoValue - fee) / 2,
});

psbt.signInput(0, keypair);
psbt.finalizeAllInputs();

const tx = psbt.extractTransaction();
console.log(tx.toHex());
