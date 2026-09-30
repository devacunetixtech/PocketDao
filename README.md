# PocketDAO

> **Your group wallet, without the spreadsheet.**

PocketDAO is a lightweight community treasury on BOT Chain. A group creates its own treasury, deposits native BOT, proposes payments, votes YES or NO, and executes payments that reach an absolute majority after a fixed voting period.

## What is included

- Responsive Next.js 16 + TypeScript dashboard
- Reconnect-safe injected wallet connection (no automatic redirect after connecting)
- BOT Chain Testnet (968) and Mainnet (677) configuration
- `PocketDAOFactory` for creating discoverable group treasuries
- `PocketDAO` treasury with members, deposits, proposals, votes, execution, balance, and history
- Fixed 1–30 day voting periods chosen at DAO creation
- Absolute-majority approval: `floor(memberCount / 2) + 1`
- Reentrancy-safe native BOT execution
- Foundry deployment script and contract tests
- Live contract reads refreshed every 12 seconds and after every confirmed transaction
- User-facing wallet and transaction errors—raw RPC errors are never shown in the interface
- No mocked wallets, balances, proposals, members, votes, or transactions
- Reusable profile logo at `public/pocketdao-logo.png` and favicon assets at `app/icon.png` and `public/favicon.ico`

## Project structure

```text
app/                  Next.js routes and global design system
components/           Wallet and dashboard UI
lib/                  BOT Chain, ABI, errors, and formatting configuration
contracts/src/        PocketDAO and factory contracts
contracts/test/       Foundry contract tests
contracts/script/     Verified BOT Chain deployment script
```

## Run the frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Contract setup

Install [Foundry](https://book.getfoundry.sh/getting-started/installation), then:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge test
```

Copy the environment template and add a funded deployer private key:

```bash
cp ../.env.example .env
source .env
```

Never commit `.env` or a private key. The repository ignores all local environment and Foundry deployment output files.

### Deploy and verify on BOT Chain Testnet

```bash
forge script script/DeployBotchain.s.sol:DeployBotchain \
  --rpc-url "$BOTCHAIN_TESTNET_RPC_URL" \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url "$BOTCHAIN_TESTNET_VERIFIER_URL" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --slow
```

### Deploy and verify on BOT Chain Mainnet

```bash
forge script script/DeployBotchain.s.sol:DeployBotchain \
  --rpc-url "$BOTCHAIN_MAINNET_RPC_URL" \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url "$BOTCHAIN_MAINNET_VERIFIER_URL" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --slow
```

After deployment, set the printed factory address for the matching network:

```env
NEXT_PUBLIC_FACTORY_TESTNET_ADDRESS=0xYourTestnetFactoryAddress
NEXT_PUBLIC_FACTORY_MAINNET_ADDRESS=0xYourMainnetFactoryAddress
```

Optionally set `NEXT_PUBLIC_DEFAULT_DAO_ADDRESS` to open a specific treasury by default.

## Governance rules

1. The creator is automatically the first member and may add members.
2. Any member may create a spending proposal or vote once per proposal.
3. Voting remains open for the DAO's fixed voting period.
4. A proposal needs more than half of all current members to vote YES.
5. Anyone may execute an approved proposal after voting closes.
6. Execution fails safely if the treasury no longer has enough BOT.
7. Each proposal snapshots its approval threshold when created, so adding members cannot alter an active vote.

## GitHub Actions deployment

The manual **Deploy PocketDAO contracts** workflow supports BOT Chain Testnet and Mainnet. Before running it, create these repository secrets:

- `PRIVATE_KEY` — funded deployment wallet private key
- `BLOCKSCOUT_API_KEY` — Blockscout verification API key

Then open **Actions → Deploy PocketDAO contracts → Run workflow** and select the target network. The workflow validates both secrets, runs all Foundry tests, deploys the factory, and verifies it on the matching BOT Chain explorer.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

The Solidity sources can also be compiled directly with solc 0.8.24; the full test suite uses Foundry.

## BOT Chain network details

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Testnet | 968 | `https://rpc.bohr.life` | `https://scan.bohr.life` |
| Mainnet | 677 | `https://rpc.botchain.ai` | `https://scan.botchain.ai` |

Native currency: BOT.

Official links: [BOT Chain](https://botchain.ai) · [Mainnet explorer](https://scan.botchain.ai)
