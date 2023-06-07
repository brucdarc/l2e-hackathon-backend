import { ethers } from 'ethers';

const rpc_url = 'WALLET_SECRET_KEY'

//0x24f597d211E487814fAA990dcD4699dB678Fb011
const WALLET_SECRET_KEY = '2e0232d624a8935256dae02ce72e7551fa05fd84c385285d641c19e669e08c5f'


const wallet = new ethers.Wallet(WALLET_SECRET_KEY);
// connect the wallet to the provider
export const signClaim = async (address: string, amount: string, nonce: string) => {

  const hashedMessage = ethers.solidityPackedKeccak256(['address', 'uint256', 'uint256'], [address, amount, nonce]);

  const digest = ethers.hashMessage(ethers.getBytes(hashedMessage));

  console.log('hash message ', hashedMessage);

  console.log('digest ', digest);

  const signature = await wallet.signMessage(ethers.getBytes(hashedMessage));

  console.log('sig hash ', signature);

  const sig  = ethers.Signature.from(signature);

  console.log('sig ', sig);

  console.log('v ', sig.v)
  console.log('r ', sig.r)
  console.log('s ', sig.s)

  console.log('wallet address ', wallet.address);

  const rec = ethers.recoverAddress(digest, signature);

  console.log('recovered address ', rec);

  return sig;

}


