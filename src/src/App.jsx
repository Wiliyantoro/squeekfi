import React, { useState } from 'react'
import { useContracts, useGlobalState, useAccount, usePipeline } from './hooks.js'
import Stake from './Stake.jsx'
import Swap from './Swap.jsx'
import Pools from './Pools.jsx'
import StakeWrite from './StakeWrite.jsx'
import Planner from './Planner.jsx'

export default function App() {
  const [tab, setTab] = useState('stake')
  const [addr, setAddr] = useState('')
  const contracts = useContracts()
  const { g, err: gerr } = useGlobalState(contracts)
  const { a: acc, err: aerr } = useAccount(contracts, addr)
  const pipe = usePipeline()

  const connect = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not detected')
      const accs = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddr(accs[0])
    } catch (e) { setAddr(''); alert('connect failed: ' + e.message) }
  }

  return (
    <>
      <h1>🐹 SqueekFi <span style={{ color: 'var(--acc)' }}>Hub</span></h1>
      <p className="sub">
        Real staking (SqueekStaking · Sepolia) + <b>PAPER</b> swap &amp; liquidity, honestly labeled.
        Read-only until you sign — no keys stored, no auto-transactions, ever.
        {contracts.err && <span className="err"> RPC error: {contracts.err}</span>}
        {!contracts.err && <span className="dim"> · RPC: {new URL(contracts.rpc).hostname}</span>}
      </p>
      <div className="tabs">
        <button className={tab === 'stake' ? 'on' : ''} onClick={() => setTab('stake')}>Stake (on-chain)</button>
        <button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Stake Actions ⚡</button>
        <button className={tab === 'planner' ? 'on' : ''} onClick={() => setTab('planner')}>Planner 🧮</button>
        <button className={tab === 'swap' ? 'on' : ''} onClick={() => setTab('swap')}>Swap (paper)</button>
        <button className={tab === 'pools' ? 'on' : ''} onClick={() => setTab('pools')}>Pools (paper)</button>
      </div>

      {tab === 'stake' && (
        <>
          <div className="row"><button className="act" onClick={connect}>Connect MetaMask (read-only)</button>
            <span className="dim" style={{ alignSelf: 'center', fontSize: 12 }}>or paste an address below</span></div>
          <Stake contracts={contracts} g={g} gerr={gerr} addr={addr} setAddr={setAddr} acc={acc} aerr={aerr} pipe={pipe} />
        </>
      )}
      {tab === 'swap' && <Swap />}
      {tab === 'pools' && <Pools />}
      {tab === 'write' && <StakeWrite />}
      {tab === 'planner' && <Planner />}

      <footer>
        Official contracts (Sepolia, release core-sepolia-20261103): Staking 0x50fd…11ca · Token 0xd78a…fa1e · NFT 0xc4c7…856b.
        Addresses sourced from docs.squeekchain.com/assets/deployments/sepolia.json — verified per render, not blindly hardcoded.
        Not affiliated with Squeekchain.{' '}
        <b>SqueekFi Hub is a community project for the Squeekchain Buildooooor badge.</b> Built by 7tomars.
      </footer>
    </>
  )
}
