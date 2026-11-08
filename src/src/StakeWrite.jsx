// Panel: Stake WRITE — approve, stake, claim, claimAndStake, unstake (non-custodial).
// v2.1: English-first copy, Sepolia auto-switch, unstake quote preview before you pay gas.
import React, { useState } from 'react'
import {
  getWalletAddress, allowanceOf, approveStaking, stakeTokens,
  claimRewards, claimAndStakeRewards, unstakeTokens, quoteUnstake,
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
  const [quote, setQuote] = useState(null)   // unstake exit preview
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

  async function previewUnstake() {
    setErr(''); setBusy(true); setQuote(null)
    try {
      setQuote(await quoteUnstake(unstakeAmt))
    } catch (e) {
      setErr(String(e.message || e).slice(0, 180))
    }
    setBusy(false)
  }

  const needApprove = allowance === null || parseFloat(amount || '0') > Number(allowance) / 1e18

  return (
    <div className="card">
      <h3>⚡ Stake Actions (writes on-chain — signed in YOUR wallet)</h3>
      <p className="muted">
        Non-custodial: this page builds the transaction, your wallet signs it. No key is ever stored, sent, or seen.
        Network: <b>Ethereum Sepolia</b> — we will ask MetaMask to switch for you if needed.
      </p>
      <div className="row">
        <button onClick={refreshAllowance} disabled={busy}>1. Check wallet &amp; allowance</button>
        {addr && (
          <span className="muted">
            <a href={`https://sepolia.etherscan.io/address/${addr}`} target="_blank" rel="noreferrer">{addr.slice(0, 6)}…{addr.slice(-4)}</a>
            {' '}allowance: {allowance === null ? '—' : (Number(allowance) / 1e18).toFixed(2)} SQK
          </span>
        )}
      </div>
      <div className="row">
        <label>Stake amount (SQK)<input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100" /></label>
        <button disabled={busy || !amount} onClick={() => run(() => approveStaking(amount), 'Approve sent ✅')}>2. Approve</button>
        <button disabled={busy || !amount || needApprove} onClick={() => run(() => stakeTokens(amount), 'Stake sent ✅')}>3. Stake</button>
      </div>
      <div className="row">
        <button disabled={busy} onClick={() => run(() => claimRewards(), 'Claim sent ✅')}>Claim rewards</button>
        <button disabled={busy} onClick={() => run(() => claimAndStakeRewards(), 'Claim+Stake sent ✅')}>
          Claim &amp; Stake (1 tx, saves gas)
        </button>
      </div>
      <div className="row">
        <label>Unstake (SQK)<input value={unstakeAmt} onChange={(e) => { setUnstakeAmt(e.target.value); setQuote(null) }} placeholder="e.g. 50" /></label>
        <button disabled={busy || !unstakeAmt} onClick={previewUnstake}>Preview exit</button>
        <button disabled={busy || !unstakeAmt} onClick={() => run(() => unstakeTokens(unstakeAmt), 'Unstake sent ✅ (max fee 0.01 SQK, 30m deadline)')}>
          Unstake
        </button>
      </div>
      {quote !== null && (
        <p className="ok">
          exit preview (read-only, from <code>quoteUnstake</code>): you would receive ≈{' '}
          <b>{(Number(quote) / 1e18).toFixed(6)} SQK</b> — the difference vs {unstakeAmt} is the contract's exit fee.
          Nothing was signed.
        </p>
      )}
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}
      <TxStatus tx={tx} />
      <p className="muted" style={{ fontSize: 12 }}>
        Flow: approve → stake (or claim &amp; stake in one tx). Exits are quoted before you sign — if the quote looks
        wrong, don't sign. This page cannot move funds on its own; that's the point.
      </p>
    </div>
  )
}
