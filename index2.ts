import { initEccLib, networks, payments, script } from "bitcoinjs-lib";
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

const p2tr = payments.p2tr({
  internalPubkey: toXOnly(keypair.publicKey),
  scriptTree,
  network,
});

console.log(p2tr.address);
