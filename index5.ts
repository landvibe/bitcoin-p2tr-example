import { initEccLib, networks, payments, script } from "bitcoinjs-lib";
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
const scriptAsm1 = `OP_ADD OP_2 OP_EQUAL`;
const scriptAsm2 = `OP_ADD OP_3 OP_EQUAL`;
const scriptAsm3 = `OP_ADD OP_4 OP_EQUAL`;
const scriptBuffer1 = script.fromASM(scriptAsm1);
const scriptBuffer2 = script.fromASM(scriptAsm2);
const scriptBuffer3 = script.fromASM(scriptAsm3);

const scriptTree: Taptree = [
  {
    output: scriptBuffer1,
  },
  [
    {
      output: scriptBuffer2,
    },
    {
      output: scriptBuffer3,
    },
  ],
];

const redeem = {
  output: scriptBuffer3,
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
console.log(controlBlock.toString("hex").length / 2);
