import React, { useMemo, useState } from 'react'

/*
 * PAPER AMM — simulator, BUKAN kontrak nyata.
 * Squeekchain belum punya DEX on-chain; jadi swap di sini adalah constant-product
 * virtual (x*y=k) yang dijalankan murni di browser, di-seed dari total supply
 * $SQK nyata agar parameternya masuk akal. Tidak ada dana, tidak ada persetujuan,
 * tidak ada transaksi. Dilabeli PAPER di mana-mana.
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
        <h2>PAPER swap — simulator, bukan kontrak nyata ⚠️</h2>
        <div className="kv"><span>virtual reserve $SQK</span><b>{(Number(sqk) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 0})}</b></div>
        <div className="kv"><span>virtual reserve vETH</span><b>{(Number(eth) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 4})}</b></div>
        <div className="kv"><span>harga spot (constant product)</span><b>{price.toFixed(6)} vETH / $SQK</b></div>
        <div className="kv"><span>volume simulasi kumulatif</span><b>{(Number(BigInt(state.vol)) / 1e18).toLocaleString('en-US', {maximumFractionDigits: 0})} $SQK</b></div>
      </div>
      <div className="card">
        <h2>Simulasi trade</h2>
        <div className="tabs" style={{ marginBottom: 8 }}>
          <button className={dir === 'buy' ? 'on' : ''} onClick={() => setDir('buy')}>BELI $SQK (bayar vETH)</button>
          <button className={dir === 'sell' ? 'on' : ''} onClick={() => setDir('sell')}>JUAL $SQK (terima vETH)</button>
        </div>
        <div className="row">
          <input placeholder={dir === 'buy' ? 'jumlah vETH (mis. 0.5)' : 'jumlah $SQK (mis. 1000)'} value={amt} onChange={e => setAmt(e.target.value)} />
          <button className="act" onClick={doSwap}>Simulasikan</button>
        </div>
        <div className="kv"><span>kamu terima (perkiraan, sudah termasuk slippage kurva)</span><b>{out} {dir === 'buy' ? '$SQK' : 'vETH'}</b></div>
        <div className="row"><button className="act" onClick={reset}>Reset pool</button></div>
      </div>
      <div className="card">
        <h2>Riwayat simulasi (local, 10 terakhir)</h2>
        {hist.length === 0 && <div className="dim">belum ada trade</div>}
        {hist.map((h, i) => <div className="kv" key={i}><span>{h.at} · {h.dir}</span><b>{h.amt}</b></div>)}
      </div>
      <div className="card">
        <h2>Kenapa paper?</h2>
        <p className="dim" style={{ fontSize: 13 }}>
          Ekosistem Squeekchain belum punya AMM/DEX on-chain, jadi klaim "swap asli" berarti bohong.
          Simulator ini jujur: kurva x·y=k dijalankan lokal, di-seed dari metrik $SQK nyata — berguna
          untuk memahami slippage & impact sebelum DEX beneran hadir. Tanpa dompet, tanpa gas, tanpa risiko.
        </p>
      </div>
    </>
  )
}
