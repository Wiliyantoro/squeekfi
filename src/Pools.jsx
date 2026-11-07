import React, { useMemo, useState } from 'react'
import { f18, f0 } from './hooks.js'

/*
 * Pools = workbench likuiditas PAPER di atas AMM yang sama dengan Swap.
 * Tambah likuiditas = donasi proporsional ke reserve virtual; share LP = sqrt(k) style.
 * Semua lokal, dilabeli PAPER.
 */
const LS = 'squeekfi.lp.v1'
function load() {
  try { return JSON.parse(localStorage.getItem(LS)) || { shares: [], amm: null } } catch { return { shares: [], amm: null } }
}
function save(s) { try { localStorage.setItem(LS, JSON.stringify(s)) } catch {} }

// reserve global AMM (dibagi dengan tab Swap via localStorage key yang sama)
function readAmm() {
  try { return JSON.parse(localStorage.getItem('squeekfi.amm.v1')) || { sqk: (500000n * 10n ** 18n).toString(), eth: '1000000000000000000n'.slice(0, 0) || '2000000000000000000' } } catch { return null }
}
// fallback seed sama dengan Swap.jsx
const SEED_SQK = 500000n * 10n ** 18n
const SEED_ETH = (1000000n * 10n ** 36n) / SEED_SQK

export default function Pools() {
  const [lp, setLp] = useState(load)
  const [sqkAmt, setSqkAmt] = useState('1000')
  const [ethAmt, setEthAmt] = useState('0.002')
  const amm = useMemo(() => readAmm() || { sqk: SEED_SQK.toString(), eth: SEED_ETH.toString() }, [lp])

  const addLiquidity = () => {
    try {
      const a = BigInt(sqkAmt) * 10n ** 18n
      const e = BigInt(Math.floor(Number(ethAmt) * 1e18))
      if (a <= 0n || e <= 0n) return
      const shares = BigInt(Math.floor(Math.sqrt(Number(a) * Number(e))))
      const s2 = { ...lp, shares: [...lp.shares, { sqk: sqkAmt, eth: ethAmt, shares: shares.toString(), at: new Date().toISOString().slice(0, 10) }] }
      setLp(s2); save(s2)
    } catch {}
  }

  const totalShares = lp.shares.reduce((acc, s) => acc + BigInt(s.shares), 0n)

  return (
    <>
      <div className="card paper">
        <h2>PAPER liquidity pool — simulator ⚠️</h2>
        <div className="kv"><span>reserve $SQK (shared dengan tab Swap)</span><b>{(Number(BigInt(amm.sqk)) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 0})}</b></div>
        <div className="kv"><span>reserve vETH</span><b>{(Number(BigInt(amm.eth)) / 1e18).toFixed(4)}</b></div>
        <div className="kv"><span>LP share kamu</span><b>{lp.shares.length} posisi · {totalShares.toString()} unit</b></div>
      </div>
      <div className="card">
        <h2>Tambah likuiditas (simulasi)</h2>
        <div className="row"><input value={sqkAmt} onChange={e => setSqkAmt(e.target.value)} placeholder="jumlah $SQK" /></div>
        <div className="row"><input value={ethAmt} onChange={e => setEthAmt(e.target.value)} placeholder="jumlah vETH (± 0.002 per 1000 SQK)" /></div>
        <button className="act" onClick={addLiquidity}>Deposit simulasikan</button>
      </div>
      <div className="card">
        <h2>Posisi LP kamu (lokal)</h2>
        {lp.shares.length === 0 && <div className="dim">belum ada posisi</div>}
        {lp.shares.map((s, i) => (
          <div className="kv" key={i}><span>{s.at} · {s.sqk} SQK + {s.eth} vETH</span><b>{s.shares} LP</b></div>
        ))}
      </div>
      <div className="card">
        <h2>Pool likuiditas ASLI yang tersedia: Staking</h2>
        <p className="dim" style={{ fontSize: 13 }}>
          Di Squeekchain, satu-satunya pool "likuiditas" nyata adalah <b>SqueekStaking</b>:
          deposit Squeek NFT + stake $SQK → dapat <b>power</b> → aliran reward $SQK dari SqueekMining
          (semua $SQK hasil mining dialirkan ke Staking). Lihat tab <b>Stake</b> untuk angka on-chain aslinya.
        </p>
      </div>
    </>
  )
}
