// Kontrak resmi Squeekchain Sepolia — sumber: docs.squeekchain.com/assets/deployments/sepolia.json
export const CHAIN_ID = 11155111n
export const RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://rpc.sepolia.org',
]
export const CONTRACTS = {
  core: '0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4',
  token: '0xd78a3956cf63164d1fa1c622ad3c66623162fa1e',
  mining: '0x2dccb11fcc2defdd188555e45acb52231e82e218',
  staking: '0x50fd1780526c3186a0c037c7622203bc4fb611ca',
  nft: '0xc4c7982657f00509548f3a3a41db7fa439a6856b',
}
// Public API (read-only, CORS *)
export const API_STATUS = 'https://api.squeekchain.com/v1/status'
