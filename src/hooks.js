import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { CONTRACTS, RPC_URLS, API_STATUS } from './config.js'
import STAKING_ABI from './abi/SqueekStaking.json'
import TOKEN_ABI from './abi/SqueekToken.json'

const f18 = x => { try { return Number(ethers.formatUnits(x, 18)).toLocaleString('en-US', {maximumFractionDigits: 2}) } catch { return '…' } }
const f0 = x => { try { return BigInt(x).toLocaleString('en-US') } catch { return '…' } }

let provider = null
function getProvider() {
  if (!provider) provider = new ethers.JsonRpcProvider(RPC_URLS[0], undefined, { staticNetwork: true })
  return provider
}

/* ---------- hook: provider failover ---------- */
export function useContracts() {
  const [st, setSt] = useState({ staking: null, token: null, err: null, rpc: RPC_URLS[0] })
  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const url of RPC_URLS) {
        try {
          const p = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true })
          // verifikasi chainId sebelum percaya
          const net = await p.getNetwork()
          if (net.chainId !== CHAIN_ID_SAFE) throw new Error('wrong chain ' + net.chainId)
          if (!alive) return
          setSt({
            staking: new ethers.Contract(CONTRACTS.staking, STAKING_ABI, p),
            token: new ethers.Contract(CONTRACTS.token, TOKEN_ABI, p),
            err: null, rpc: url,
          })
          return
        } catch (e) { /* coba RPC berikutnya */ }
      }
      if (alive) setSt(s => ({ ...s, err: 'semua RPC gagal' }))
    })()
    return () => { alive = false }
  }, [])
  return st
}
const CHAIN_ID_SAFE = 11155111n

/* ---------- global pool state (real on-chain reads) ---------- */
export function useGlobalState(contracts) {
  const [g, setG] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    if (!contracts.staking) return
    let alive = true
    const pull = async () => {
      try {
        const [totalStaked, powerParams, rewardState, recentExits, paused] = await Promise.all([
          contracts.staking.totalStaked(),
          contracts.staking.powerParameters(),
          contracts.staking.rewardState(),
          contracts.staking.recentExits(),
          contracts.staking.paused(),
        ])
        if (!alive) return
        setG({
          totalStaked: totalStaked.toString(),
          powerParams: [powerParams[0].toString(), powerParams[1].toString()],
          rewardState,
          recentExits: recentExits.toString(),
          paused: Boolean(paused),
          at: Date.now(),
        })
        setErr(null)
      } catch (e) { if (alive) setErr(String(e).slice(0, 140)) }
    }
    pull()
    const iv = setInterval(pull, 15000)
    return () => { alive = false; clearInterval(iv) }
  }, [contracts])
  return { g, err }
}

/* ---------- per-account (real on-chain reads) ---------- */
export function useAccount(contracts, address) {
  const [a, setA] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    if (!contracts.staking || !ethers.isAddress(address || '')) { setA(null); return }
    let alive = true
    const pull = async () => {
      try {
        const [stakeOf, accountPower, claimable] = await Promise.all([
          contracts.staking.stakeOf(address),
          contracts.staking.accountPower(address),
          contracts.staking.claimable(address),
        ])
        if (!alive) return
        setA({
          stakedSqueeks: stakeOf[0].toString(),     // jumlah Squeek NFT yang dideposit
          stakedSqk: stakeOf[1].toString(),          // $SQK yang distake (wei)
          lastTouch: stakeOf[2].toString(),
          powerFresh: accountPower[0].toString(),    // power aktif
          powerWithheld: accountPower[1].toString(), // power tertahan (exit policy)
          claimable: claimable.toString(),           // reward $SQK siap claim (wei)
        })
        setErr(null)
      } catch (e) { if (alive) setErr(String(e).slice(0, 140)) }
    }
    pull()
    const iv = setInterval(pull, 15000)
    return () => { alive = false; clearInterval(iv) }
  }, [contracts, address])
  return { a, err }
}

/* ---------- pipa on-chain: settlement lag untuk konteks reward ---------- */
export function usePipeline() {
  const [p, setP] = useState(null)
  useEffect(() => {
    let alive = true
    const pull = async () => {
      try {
        const r = await fetch(API_STATUS, { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        if (!alive || !d.builder) return
        const m = d.measurement || {}, b = d.builder || {}
        const meas = BigInt(m.cumulativeWorkUnits || '0')
        const setl = BigInt(b.anchor?.cumulativeWork || '0')
        setP({ lag: (meas > setl ? meas - setl : 0n).toString(), freshness: m.freshness })
      } catch { /* silent */ }
    }
    pull()
    const iv = setInterval(pull, 20000)
    return () => { alive = false; clearInterval(iv) }
  }, [])
  return p
}

export { f18, f0, getProvider }
