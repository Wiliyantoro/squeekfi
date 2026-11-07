// squeekfi write layer — NON-CUSTODIAL: semua tx ditandatangani di wallet user.
// Backend tidak pernah melihat private key.
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers'
import { CONTRACTS, CHAIN_ID } from './config.js'
import StakingABI from './abi/SqueekStaking.json'
import TokenABI from './abi/SqueekToken.json'

export function parseToken(s) {
  // desimal string -> wei BigInt tanpa float
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

async function getSigner() {
  if (!window.ethereum) throw new Error('MetaMask tidak terdeteksi')
  const bp = new BrowserProvider(window.ethereum)
  const net = await bp.getNetwork()
  if (net.chainId !== CHAIN_ID) {
    throw new Error('Salah jaringan — buka MetaMask, pilih Ethereum Sepolia (11155111)')
  }
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
  const t = token(s)
  const v = await t.allowance(address, CONTRACTS.staking)
  return BigInt(v)
}

export async function approveStaking(amountHuman) {
  const s = await getSigner()
  const t = token(s)
  const tx = await t.approve(CONTRACTS.staking, parseToken(amountHuman))
  return { hash: tx.hash, wait: () => tx.wait() }
}

export async function stakeTokens(amountHuman) {
  const s = await getSigner()
  const st = staking(s)
  const tx = await st.stake(parseToken(amountHuman))
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

// read helpers for planner
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
