import { createPublicClient, http, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount('0x1f2fb79faeaa3fb75cbba4698fba58acdf5bc3afbf7eef3a57ae6e87cd612e3f');
console.log('Address:', account.address);

const client = createPublicClient({
  chain: celo,
  transport: http()
});

async function run() {
  const balance = await client.getBalance({ address: account.address });
  console.log('Balance:', formatEther(balance));
}
run();
