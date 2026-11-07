// Panel Stake WRITE — approve, stake, claim, claimAndStake, unstake (non-custodial).
import React, { useState } from 'react'
import {
  getWalletAddress, allowanceOf, approveStaking, stakeTokens,
  claimRewards, claimAndStakeRewards, unstakeTokens,
} from './write.js'

function TxStatus({ tx }) {
  if (!tx) return null
  return (
    <p className="muted">
      tx: <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash.slice(0, 18)}…</a>
      {' '}{tx.mined ? '✅ confirmed' : '⏳ pending'}
    </p>
  )
}

export default function StakeWrite() {
  const [amount, setAmount] = useState('')
  const [unstakeAmt, setUnstakeAmt] = useState('')
  const [addr, setAddr] = useState('')
  const [allowance, setAllowance] = useState(null)
  const [tx, setTx] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function run(fn, okMsg) {
    setErr(''); setMsg(''); setBusy(true); setTx(null)
    try {
      const t = await fn()
      setTx({ hash: t.hash, mined: false })
      await t.wait()
      setTx({ hash: t.hash, mined: true })
      setMsg(okMsg)
    } catch (e) {
      setErr(String(e.message || e).slice(0, 180))
    }
    setBusy(false)
  }

  async function refreshAllowance() {
    setErr(''); setBusy(true)
    try {
      const a = await getWalletAddress()
      setAddr(a)
      setAllowance(await allowanceOf(a))
    } catch (e) {
      setErr(String(e.message || e).slice(0, 180))
    }
    setBusy(false)
  }

  const needApprove = allowance === null || parseFloat(amount || '0') > Number(allowance) / 1e18

  return (
    <div className="card">
      <h3>⚡ Stake Actions (tulis on-chain — tanda tangan di wallet lu)</h3>
      <p className="muted">
        Non-custodial: tx dibangun di sini, ditandatangani MetaMask lu. Situs tidak menyimpan kunci apa pun.
        Jaringan wajib <b>Ethereum Sepolia</b>.
      </p>
      <div className="row">
        <button onClick={refreshAllowance} disabled={busy}>1. Cek dompet &amp; allowance</button>
        {addr && <span className="muted">{addr.slice(0, 6)}…{addr.slice(-4)} allowance: {allowance === null ? '—' : (Number(allowance) / 1e18).toFixed(2)} SQK</span>}
      </div>
      <div className="row">
        <label>Jumlah stake (SQK)<input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="mis. 100" /></label>
        <button disabled={busy || !amount} onClick={() => run(() => approveStaking(amount), 'Approve terkirim ✅')}>
          2. Approve
        </button>
        <button disabled={busy || !amount || needApprove} onClick={() => run(() => stakeTokens(amount), 'Stake terkirim ✅')}>
          3. Stake
        </button>
      </div>
      <div className="row">
        <button disabled={busy} onClick={() => run(() => claimRewards(), 'Claim terkirim ✅')}>Claim reward</button>
        <button disabled={busy} onClick={() => run(() => claimAndStakeRewards(), 'Claim+Stake terkirim ✅')}>
          Claim &amp; Stake (1 tx)
        </button>
      </div>
      <div className="row">
        <label>Unstake (SQK)<input value={unstakeAmt} onChange={(e) => setUnstakeAmt(e.target.value)} placeholder="mis. 50" /></label>
        <button disabled={busy || !unstakeAmt} onClick={() => run(() => unstakeTokens(unstakeAmt), 'Unstake terkirim ✅ (fee maks 0.01 SQK, deadline 30m)')}>
          Unstake
        </button>
      </div>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}
      <TxStatus tx={tx} />
    </div>
  )
}
