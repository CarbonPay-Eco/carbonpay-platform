# CarbonPay

CarbonPay is an end-to-end platform for carbon credit tokenization, offsetting, and traceability built on the Solana blockchain. It enables organizations to offset their carbon footprint through verifiable, auditable, and transparent smart contracts — with metadata and certification securely stored via IPFS.

---

## 🌍 Project Overview

CarbonPay bridges Web3 infrastructure with real-world environmental assets. Our platform allows companies to:

- Onboard their organization using wallet-based authentication.
- Browse tokenized carbon credit projects with full metadata.
- Purchase and retire carbon credits on-chain using USDC or SOL.
- Generate compliance-ready audit reports.
- Provide public traceability of offsets through explorer-linked pages.

---

## 🧩 Architecture Summary

- **Frontend**: Next.js + Tailwind (under `/frontend`)
- **Backend**: Node.js + TypeScript + Express (under `/backend`)
- **Smart Contracts**: Solana + Anchor Framework (under `/contracts`)
- **Database**: PostgreSQL (off-chain metadata)
- **Decentralized Storage**: IPFS (for certification documents)

---

## 🔐 Authentication Model

- Fully wallet-based login (Phantom, Backpack, etc.)
- No email/password
- Wallet signature used to authorize all operations
- Organizations and admins are mapped via wallet address

---

## 📊 Database Model (Simplified)

### `wallets`
Stores all connected wallets.
- wallet_address
- provider
- role (`admin`, `organization`)

### `organizations`
Linked to a wallet. Stores onboarding data:
- company_name
- registration_number (e.g. CNPJ)
- sustainability_certifications
- tracks_emissions
- emission_sources

### `tokenized_projects`
Each record = 1 SPL Token
- token_id
- project_name
- certification_body
- verifier_name
- vintage_year
- total_issued (tCO₂)
- ipfs_hash
- price_per_ton

### `retirements`
Tracks carbon credits burned on-chain
- wallet_id
- tokenized_project_id
- quantity
- tx_hash
- reporting_period_start / end

---

## 🔗 Smart Contract (Solana)

Written in Rust with the Anchor framework.
- `mint_credit()` — Admin mints token with metadata + IPFS hash
- `burn_credit()` — Organization retires token (carbon offset)
- `get_credit_data()` — Read-only access to project data

---

## 🔄 IPFS Integration

- Certification files and documentation are pinned to IPFS.
- Returned IPFS hash is stored on-chain and in the database.

---

## 🚀 Key Functionalities

- Admin dashboard to tokenize verified projects
- Public traceability of offsets (wallet-based)
- Organizational dashboard for analytics and reports
- Automated offsetting (recurring rules – coming soon)

---

## 📂 Monorepo Structure

```
carbonpay-platform/
├── frontend/       # Next.js + Tailwind UI
├── backend/        # Node.js + Express + Prisma + IPFS + Anchor
├── contracts/      # Anchor-based Solana smart contracts
└── README.md
```

---

## 🧪 Testing & Deployment

- Unit & Integration testing with Jest + Supertest
- Solana Devnet for end-to-end contract tests
- Docker-ready setup for deployment
- IPFS via Infura or Pinata

---

## 📜 License

MIT License – CarbonPay © 2024
