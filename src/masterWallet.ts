import { ethers } from 'ethers';

const rpc_url = 'WALLET_SECRET_KEY'

//0x24f597d211E487814fAA990dcD4699dB678Fb011
const WALLET_SECRET_KEY = '2e0232d624a8935256dae02ce72e7551fa05fd84c385285d641c19e669e08c5f'


const provider = new ethers. //providers.JsonRpcProvider(URL);
const wallet = new ethers.Wallet(WALLET_SECRET_KEY);
// connect the wallet to the provider
const signer = wallet.connect(provider);




