import React from 'react'
import { f18, f0 } from './hooks.js'

export default function Stake({ contracts, g, gerr, addr, setAddr, acc, aerr, pipe }) {
  return (
    <>
      <div className="card">
        <h2>Staking pool (SqueekStaking · live on-chain)</h2>
        {gerr && <div className="err">RPC: {gerr}</div>}
        {!g && !gerr && <div className="dim">loading…</div>}
        {g && (
          <>
            <div className="kv"><span>total $SQK staked</span><b>{f18(g.totalStaked)}</b></div>
            <div className="kv"><span>power parameter α</span><b>{f0(g.powerParams[0])}</b></div>
            <div className="kv"><span>power parameter β</span><b>{f0(g.powerParams[1])}</b></div>
            <div className="kv"><span>recent exits</span><b>{f0(g.recentExits)}</b></div>
            <div className="kv"><span>contract paused</span><b className={g.paused ? 'bad' : 'ok'}>{String(g.paused)}</b></div>
            <div className="kv"><span>reward funding stream</span><b className="dim">live (funded-stream-q128-1)</b></div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Your account (read-only — no connect required, no signature)</h2>
        <div className="row">
          <input placeholder="0x… wallet address (or empty)" value={addr}
            onChange={e => setAddr(e.target.value.trim())} spellCheck="false" />
        </div>
        {addr && !/^0x[a-fA-F0-9]{40}$/.test(addr) && <div className="err">invalid address</div>}
        {aerr && <div className="err">{aerr}</div>}
        {acc && (
          <>
            <div className="kv"><span>deposited Squeek NFTs</span><b>{f0(acc.stakedSqueeks)}</b></div>
            <div className="kv"><span>staked $SQK</span><b>{f18(acc.stakedSqk)}</b></div>
            <div className="kv"><span>active power</span><b>{f0(acc.powerFresh)}</b></div>
            <div className="kv"><span>withheld power (exit policy)</span><b className="warn">{f0(acc.powerWithheld)}</b></div>
            <div className="kv"><span>claimable rewards</span><b className="ok">{f18(acc.claimable)} $SQK</b></div>
          </>
        )}
        <p className="dim" style={{ fontSize: 12, marginTop: 8 }}>
          Writing (deposit/stake/claim) requires your wallet to sign — this tab only reads.
          Real transactions always come from your own wallet. See the ⚡ Stake Actions tab.
        </p>
      </div>

      {pipe && (
        <div className="card">
          <h2>Pipeline context (why stakers should care)</h2>
          <div className="kv"><span>settlement lag (unsettled work)</span><b>{f0(pipe.lag)}</b></div>
          <div className="kv"><span>measurement freshness</span><b className={pipe.freshness === 'fresh' || pipe.freshness === 'online' ? 'ok' : 'warn'}>{pipe.freshness}</b></div>
          <p className="dim" style={{ fontSize: 12 }}>Rewards stream from work that has SETTLED — a big lag means pending rewards stay pending.</p>
        </div>
      )}
    </>
  )
}
