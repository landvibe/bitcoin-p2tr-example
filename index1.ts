import { initEccLib, networks } from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";

initEccLib(tinysecp);
const ECPair = ECPairFactory(tinysecp);
const network = networks.regtest;

const keypair = ECPair.makeRandom({ network });
console.log(keypair.privateKey?.toString("hex"));
