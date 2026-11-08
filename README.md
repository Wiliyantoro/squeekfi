# SqueekFi Hub

**SqueekFi Hub is a community project for the Squeekchain Buildooooor badge.**
Built by **7tomars** (wallet `0xF24A…9885`, attribution in `squeekchain.json`). Not affiliated with Squeekchain.

A non-custodial holder utility for the Squeekchain ecosystem on **Ethereum Sepolia** — real staking actions,
real contract math, and honest paper simulators where no on-chain equivalent exists.

## What it does

| Tab | What it is | Custody |
|---|---|---|
| **Stake (on-chain)** | Live SqueekStaking pool state + any wallet's deposited Squeeks, staked $SQK, active/withheld power, claimable rewards. Also shows settlement pipeline context (why stakers care about lag). | read-only |
| **Stake Actions ⚡** | The actual writes: approve → stake, claim, claim & stake in one tx, unstake with an **exit preview** (read-only `quoteUnstake` before you sign). Sepolia auto-switch via `wallet_switchEthereumChain` / `wallet_addEthereumChain`. | non-custodial — your wallet signs |
| **Planner 🧮** | Compound/merge strategy simulator using the **real contract's** `quotePower()` — compares no-claim / claim-hold / claimAndStake / partial-stake scenarios. | read-only |
| **Swap (paper)** | Constant-product AMM simulator (x·y=k), seeded from real $SQK metrics. Honest because there is no on-chain DEX yet — a "real swap" claim would be a lie. | simulation only |
| **Pools (paper)** | Paper liquidity workbench on the same virtual AMM; explains that the only real pool is SqueekStaking itself. | simulation only |

## Non-custodial, by construction

- No backend. Static site. No key is ever stored, transmitted, or seen.
- Every write is built here and signed in **your** wallet (MetaMask). If a page asks for your seed phrase, close the tab.
- All token amounts are parsed as `BigInt` (no float math). API/contract responses are treated as untrusted input.
- Simulators are labeled **PAPER** everywhere they appear.

## Run it

```bash
npm install
npm run dev      # local dev
npm run build    # static export in dist/ (relative paths, IPFS-friendly)
```

Deploy: serve `dist/` at any static host. The site reads only public endpoints:

- RPC: `ethereum-sepolia-rpc.publicnode.com`, `1rpc.io/sepolia`, `rpc.sepolia.org`
- Contracts: the official Sepolia deployments from `docs.squeekchain.com/assets/deployments/sepolia.json` (verified per render, not blindly hardcoded — see `src/config.js`)
- Telemetry: `api.squeekchain.com/v1/status` (public, read-only)

## Attribution

- Member: **7tomars** · `squeekchain.json` shipped with the build
- Source: [github.com/Wiliyantoro/squeekfi](https://github.com/Wiliyantoro/squeekfi)
- Live: `https://squeek.kgwilly.my.id/squeekfi/` (served alongside the SqueekPulse v3 radar)

## Changelog

- **v2.1** — English-first copy, Sepolia auto-switch, unstake exit preview (`quoteUnstake`), Etherscan links, submission README, honest-paper relabel pass.
- **v2.0** — Stake Actions (real writes), Planner on real `quotePower`, paper AMM shared state.
- **v1.0** — read-only staking dashboard.
