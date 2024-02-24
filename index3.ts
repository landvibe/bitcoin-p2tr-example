import { Psbt, initEccLib, networks, payments, script } from "bitcoinjs-lib";
import { LEAF_VERSION_TAPSCRIPT } from "bitcoinjs-lib/src/payments/bip341";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { Taptree } from "bitcoinjs-lib/src/types";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";
import { witnessStackToScriptWitness } from "./helper";

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

const scriptRedeem = {
  output: scriptBuffer2,
  redeemVersion: LEAF_VERSION_TAPSCRIPT,
};
const p2tr = payments.p2tr({
  internalPubkey: toXOnly(keypair.publicKey),
  scriptTree,
  network,
  redeem: scriptRedeem,
});

if (!p2tr.witness || !p2tr.output) {
  throw new Error("witness and output is required");
}
const tapLeafScript = {
  leafVersion: scriptRedeem.redeemVersion,
  script: scriptRedeem.output,
  controlBlock: p2tr.witness[p2tr.witness.length - 1],
};

const psbt = new Psbt({ network });
const txid = "64d8a2ab7ca706ac759736829956195c44c69e73581cf827190ad86f6d9812a1";
const vout = 0;
const utxoValue = 1000e4;
const fee = 1000;
psbt.addInput({
  hash: txid,
  index: vout,
  witnessUtxo: { value: utxoValue, script: p2tr.output },
  tapLeafScript: [tapLeafScript],
});

psbt.addOutput({
  address: "bcrt1qxh0kt0ue3tgk93u8z02elmfgkx9m57rlwahd30",
  value: (utxoValue - fee) / 2,
});
psbt.addOutput({
  address: "bcrt1pcmd8kqe47vcwvf43saanma4dv5tuz2xwywwnc3884zwy7ehql2jsemj47h",
  value: (utxoValue - fee) / 2,
});

const customFinalizer = () => {
  try {
    const witness = [
      Buffer.from([2]),
      Buffer.from([3]),
      tapLeafScript.script,
      tapLeafScript.controlBlock,
    ];
    return { finalScriptWitness: witnessStackToScriptWitness(witness) };
  } catch (err) {
    throw new Error(`Can not finalize taproot input: ${err}`);
  }
};

psbt.finalizeInput(0, customFinalizer);

const tx = psbt.extractTransaction();
console.log(tx.toHex());
