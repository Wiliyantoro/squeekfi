// Planner: merge/compound strategy panel — matematika pakai quotePower kontrak ASLI.
import React, { useState } from 'react'
import { parseToken, powerParams, quotePower, stakeOfAccount, claimableOf, getWalletAddress } from './write.js'

function fmt(v) {
  return (Number(v) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function Planner() {
  const [addr, setAddr] = useState('')
  const [principal, setPrincipal] = useState('') // SQK
  const [claimable, setClaimable] = useState('') // SQK
  const [nftPower, setNftPower] = useState('0')
  const [alpha, setAlpha] = useState(null)
  const [beta, setBeta] = useState(null)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // quotePower(principal, nftPower) kontrak asli — kita bandingkan skenario
  async function loadOnChain() {
    setErr(''); setBusy(true)
    try {
      const a = addr || (await getWalletAddress())
      setAddr(a)
      const so = await stakeOfAccount(a)
      setPrincipal((Number(so.principal) / 1e18).toString())
      const c = await claimableOf(a)
      setClaimable((Number(c) / 1e18).toString())
      const p = await powerParams()
      setAlpha(p.alpha); setBeta(p.beta)
    } catch (e) {
      setErr(String(e.message || e).slice(0, 160))
    }
    setBusy(false)
  }

  async function simulate() {
    setErr(''); setBusy(true)
    try {
      const pW = parseToken(principal)
      const nW = parseToken(nftPower)
      const cW = parseToken(claimable || '0')
      const scenarios = [
        { name: 'Tidak claim (patokan)', add: 0n },
        { name: 'Claim → hold (tidak di-stake)', add: 0n },
        { name: 'Claim → claimAndStake', add: cW },
        { name: 'Claim + stake 50% ekstra manual', add: cW / 2n },
      ]
      const out = []
      for (const sc of scenarios) {
        const p0 = await quotePower(pW, nW)
        const p1 = await quotePower(pW + sc.add, nW)
        out.push({
          name: sc.name,
          powerNow: p0,
          powerAfter: p1,
          gain: p1 - p0,
          gainPct: p0 > 0n ? Number((p1 - p0) * 10000n / p0) / 100 : 0,
        })
      }
      setRows(out)
    } catch (e) {
      setErr(String(e.message || e).slice(0, 160))
    }
    setBusy(false)
  }

  return (
    <div className="card">
      <h2>🧮 Planner — Strategi Compound &amp; Merge</h2>
      <p className="muted">
        Simulasi pakai <code>quotePower()</code> dari kontrak staking ASLI (Sepolia) — bukan perkiraan sendiri.
        Semua angka tampil apa adanya; tidak ada rekomendasi otomatis.
      </p>
      <div className="row">
        <input placeholder="Wallet (kosong = dompet terhubung)" value={addr} onChange={(e) => setAddr(e.target.value)} />
        <button onClick={loadOnChain} disabled={busy}>{busy ? '…' : 'Muat on-chain'}</button>
      </div>
      <div className="row">
        <label>Principal (SQK)<input value={principal} onChange={(e) => setPrincipal(e.target.value)} /></label>
        <label>Claimable (SQK)<input value={claimable} onChange={(e) => setClaimable(e.target.value)} /></label>
        <label>NFT power<input value={nftPower} onChange={(e) => setNftPower(e.target.value)} /></label>
      </div>
      {alpha && (
        <p className="muted">powerParameters α={alpha.toString()} β={beta ? beta.toString() : '—'}</p>
      )}
      <button onClick={simulate} disabled={busy}>{busy ? 'Menghitung…' : 'Simulasikan skenario'}</button>
      {err && <p className="err">{err}</p>}
      {rows.length > 0 && (
        <table>
          <thead><tr><th>Skenario</th><th>Power sekarang</th><th>Power setelah</th><th>Gain</th><th>Gain %</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{fmt(r.powerNow)}</td>
                <td>{fmt(r.powerAfter)}</td>
                <td>{fmt(r.gain)}</td>
                <td>{r.gainPct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted">
        Skema: <code>claimAndStake</code> = claim lalu stake ulang dalam 1 tx (gas lebih hemat).
        Unstake ada exit fee — selalu cek <code>quoteUnstake()</code> sebelum eksekusi.
      </p>
    </div>
  )
}
