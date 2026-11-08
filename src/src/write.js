// squeekfi write layer — NON-CUSTODIAL: every tx is signed in the user's wallet.
// No backend, no key storage, no signing service. Ever.
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers'
import { CONTRACTS, CHAIN_ID, RPC_URLS } from './config.js'
import StakingABI from './abi/SqueekStaking.json'
import TokenABI from './abi/SqueekToken.json'

const CHAIN_ID_HEX = '0xaa36a7' // 11155111

export function parseToken(s) {
  // decimal string -> wei BigInt, no float math. ever.
  s = String(s ?? '').trim()
  if (!s) return 0n
  const neg = s.startsWith('-')
  if (neg) s = s.slice(1)
  let [i, f = ''] = s.split('.')
  if (!/^\d*$/.test(i) || !/^\d*$/.test(f)) throw new Error('invalid number')
  f = (f + '000000000000000000').slice(0, 18)
  const v = BigInt(i || '0') * 10n ** 18n + BigInt(f || '0')
  return neg ? -v : v
}

// make sure the wallet is on Sepolia — ask politely, add the chain if missing.
export async function ensureSepolia() {
  if (!window.ethereum) throw new Error('MetaMask not detected')
  const bp = new BrowserProvider(window.ethereum)
  const net = await bp.getNetwork()
  if (net.chainId === CHAIN_ID) return true
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] })
  } catch (e) {
    if (e && (e.code === 4902 || /unrecognized|not added/i.test(String(e.message)))) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: CHAIN_ID_HEX,
          chainName: 'Ethereum Sepolia',
          nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: RPC_URLS,
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
    } else { throw e }
  }
  return true
}

async function getSigner() {
  await ensureSepolia()
  const bp = new BrowserProvider(window.ethereum)
  return bp.getSigner()
}

export async function getWalletAddress() {
  const s = await getSigner()
  return s.getAddress()
}

const staking = (signer) => new Contract(CONTRACTS.staking, StakingABI, signer)
const token = (signer) => new Contract(CONTRACTS.token, TokenABI, signer)

export async function allowanceOf(address) {
  const s = await getSigner()
  const v = await token(s).allowance(address, CONTRACTS.staking)
  return BigInt(v)
}

export async function approveStaking(amountHuman) {
  const s = await getSigner()
  const tx = await token(s).approve(CONTRACTS.staking, parseToken(amountHuman))
  return { hash: tx.hash, wait: () => tx.wait() }
}

export async function stakeTokens(amountHuman) {
  const s = await getSigner()
  const tx = await staking(s).stake(parseToken(amountHuman))
  return { hash: tx.hash, wait: () => tx.wait() }
}

export async function claimRewards() {
  const s = await getSigner()
  const tx = await staking(s).claim(s.address ?? (await s.getAddress()))
  return { hash: tx.hash, wait: () => tx.wait() }
}

export async function claimAndStakeRewards() {
  const s = await getSigner()
  const tx = await staking(s).claimAndStake()
  return { hash: tx.hash, wait: () => tx.wait() }
}

export async function unstakeTokens(amountHuman, maxFeeHuman = '0.01', deadlineMin = 30) {
  const s = await getSigner()
  const tx = await staking(s).unstake(
    parseToken(amountHuman),
    parseToken(maxFeeHuman),
    BigInt(Math.floor(Date.now() / 1000) + deadlineMin * 60),
  )
  return { hash: tx.hash, wait: () => tx.wait() }
}

// preview the exit before paying gas for it — read-only call, nothing signed
export async function quoteUnstake(amountHuman, maxFeeHuman = '0.01', deadlineMin = 30) {
  const s = await getSigner()
  const st = staking(s)
  if (!st.quoteUnstake) throw new Error('quoteUnstake not exposed by this ABI build')
  const q = await st.quoteUnstake(
    parseToken(amountHuman),
    parseToken(maxFeeHuman),
    BigInt(Math.floor(Date.now() / 1000) + deadlineMin * 60),
  )
  return BigInt(q)
}

// read helpers for the Planner
export async function powerParams() {
  const s = await getSigner()
  const [alpha, beta] = await staking(s).powerParameters()
  return { alpha: BigInt(alpha), beta: BigInt(beta) }
}

export async function quotePower(principalWei, nftPowerWei) {
  const s = await getSigner()
  return BigInt(await staking(s).quotePower(principalWei, nftPowerWei))
}

export async function stakeOfAccount(address) {
  const s = await getSigner()
  const [principal, fresh, since] = await staking(s).stakeOf(address)
  return { principal: BigInt(principal), fresh: BigInt(fresh), since: BigInt(since) }
}

export async function claimableOf(address) {
  const s = await getSigner()
  return BigInt(await staking(s).claimable(address))
}

export { formatEther, parseEther }
