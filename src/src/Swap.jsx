import React, { useMemo, useState } from 'react'

/*
 * PAPER AMM — a simulator, NOT a real contract.
 * Squeekchain has no on-chain DEX yet, so this swap is a virtual constant-product
 * curve (x*y=k) running purely in the browser, seeded from real $SQK metrics so the
 * parameters make sense. No funds, no approvals, no transactions. Labeled PAPER everywhere.
 */
const LS = 'squeekfi.amm.v1'
// parse "0.01" / "1e-3" style decimal → wei BigInt tanpa float error besar
function toWei(s) {
  const m = String(s || '').trim()
  if (!/^\d*\.?\d+$/.test(m)) return 0n
  const [i, f = ''] = m.split('.')
  const frac = (f + '0'.repeat(18)).slice(0, 18)
  return BigInt(i || '0') * 10n ** 18n + BigInt(frac)
}
const K = 1_000_000n * 10n ** 36n // 1M SQK * 1 ETH (18+18)
const SEED_SQK = 500_000n * 10n ** 18n
const SEED_ETH = K / SEED_SQK // harga awal 2 ETH per SQK

function load() {
  try { return JSON.parse(localStorage.getItem(LS)) || null } catch { return null }
}
function save(s) { try { localStorage.setItem(LS, JSON.stringify(s)) } catch {} }

export default function Swap() {
  const [state, setState] = useState(() => load() || { sqk: SEED_SQK.toString(), eth: SEED_ETH.toString(), vol: '0' })
  const [dir, setDir] = useState('buy')     // buy = ETH->SQK, sell = SQK->ETH
  const [amt, setAmt] = useState('')
  const [hist, setHist] = useState(() => { try { return JSON.parse(localStorage.getItem(LS + '.h')) || [] } catch { return [] } })

  const sqk = BigInt(state.sqk), eth = BigInt(state.eth)
  const price = useMemo(() => { try { return Number(eth) / Number(sqk) } catch { return 0 } }, [state])
  const out = useMemo(() => {
    try {
      const a = toWei(amt)
      if (a <= 0n) return '0'
      if (dir === 'buy') {
        const newEth = eth + a
        const newSqk = K / newEth
        return ((sqk - newSqk) / 10n ** 18n).toLocaleString('en-US', {maximumFractionDigits: 2})
      } else {
        const newSqk = sqk + a
        const newEth = K / newSqk
        return (Number(eth - newEth) / 1e18).toFixed(6)
      }
    } catch { return '0' }
  }, [amt, dir, state])

  const doSwap = () => {
    try {
      const a = toWei(amt)
      if (a <= 0n) return
      let ns = sqk, ne = eth, vol = BigInt(state.vol)
      if (dir === 'buy') { const n2 = K / (eth + a); ns = sqk - n2; ne = eth + a }
      else { const n2 = K / (sqk + a); ns = sqk + a; ne = eth - n2 }
      const s2 = { sqk: ns.toString(), eth: ne.toString(), vol: (vol + a).toString() }
      setState(s2); save(s2)
      const h2 = [{ dir, amt: amt, at: new Date().toISOString().slice(11, 19) }, ...hist].slice(0, 10)
      setHist(h2); localStorage.setItem(LS + '.h', JSON.stringify(h2))
      setAmt('')
    } catch {}
  }

  const reset = () => { const s = { sqk: SEED_SQK.toString(), eth: SEED_ETH.toString(), vol: '0' }; setState(s); save(s); setHist([]); localStorage.removeItem(LS + '.h') }

  return (
    <>
      <div className="card paper">
        <h2>PAPER swap — simulator, not a real contract ⚠️</h2>
        <div className="kv"><span>virtual $SQK reserve</span><b>{(Number(sqk) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 0})}</b></div>
        <div className="kv"><span>virtual vETH reserve</span><b>{(Number(eth) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 4})}</b></div>
        <div className="kv"><span>spot price (constant product)</span><b>{price.toFixed(6)} vETH / $SQK</b></div>
        <div className="kv"><span>cumulative simulated volume</span><b>{(Number(BigInt(state.vol)) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 0})} $SQK</b></div>
      </div>
      <div className="card">
        <h2>Trade simulator</h2>
        <div className="tabs" style={{ marginBottom: 8 }}>
          <button className={dir === 'buy' ? 'on' : ''} onClick={() => setDir('buy')}>BUY $SQK (pay vETH)</button>
          <button className={dir === 'sell' ? 'on' : ''} onClick={() => setDir('sell')}>SELL $SQK (receive vETH)</button>
        </div>
        <div className="row">
          <input placeholder={dir === 'buy' ? 'vETH amount (e.g. 0.5)' : '$SQK amount (e.g. 1000)'} value={amt} onChange={e => setAmt(e.target.value)} />
          <button className="act" onClick={doSwap}>Simulate</button>
        </div>
        <div className="kv"><span>you receive (estimate, incl. curve slippage)</span><b>{out} {dir === 'buy' ? '$SQK' : 'vETH'}</b></div>
        <div className="row"><button className="act" onClick={reset}>Reset pool</button></div>
      </div>
      <div className="card">
        <h2>Simulated history (local, last 10)</h2>
        {hist.length === 0 && <div className="dim">no trades yet</div>}
        {hist.map((h, i) => <div className="kv" key={i}><span>{h.at} · {h.dir}</span><b>{h.amt}</b></div>)}
      </div>
      <div className="card">
        <h2>Why paper?</h2>
        <p className="dim" style={{ fontSize: 13 }}>
          The Squeekchain ecosystem has no on-chain AMM/DEX yet, so claiming a "real swap" would be a lie.
          This simulator is honest: the x·y=k curve runs locally, seeded from real $SQK metrics — useful for
          understanding slippage & impact before a real DEX exists. No wallet, no gas, no risk.
        </p>
      </div>
    </>
  )
}
