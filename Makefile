.PHONY: dev api web contracts codegen codegen-check api-check web-check test e2e check

CHAIN_ENV = VITE_CHAIN_ID=46630 VITE_CHAIN_NAME='Robinhood Chain Testnet' VITE_RPC_URL=https://rpc.testnet.chain.robinhood.com VITE_EXPLORER_URL=https://explorer.testnet.chain.robinhood.com VITE_FACTORY_ADDRESS=0x9Db674834F4C060114Cb53f21e179fc54F905342 VITE_COLLATERAL_ADDRESS=0x7BA735a381B9FFe700a8c92558659461b359ee9c VITE_API_BASE=/v1 VITE_WALLETCONNECT_PROJECT_ID=ci-placeholder

api:
	cd api && uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

web:
	$(CHAIN_ENV) npm run dev --prefix web -- --host 0.0.0.0

dev:
	trap 'kill 0' INT TERM EXIT; (cd api && uv run uvicorn api.main:app --host 0.0.0.0 --port 8000) & ($(CHAIN_ENV) npm run dev --prefix web -- --host 0.0.0.0) & wait

contracts:
	forge fmt --check --root contracts
	forge build --root contracts
	forge test --root contracts -vv

codegen:
	forge build --root contracts
	node scripts/codegen/contracts.mjs
	uv run --project api python api/export_openapi.py
	npm run codegen --prefix web

codegen-check: codegen
	git diff --exit-code -- api/openapi.json web/src/generated web/src/lib/api/generated

api-check:
	uv run --project api ruff format --check api api/tests
	uv run --project api ruff check api api/tests
	cd api && uv run mypy api && uv run pytest && uv run python export_openapi.py && uv run python selfcheck.py

web-check:
	$(CHAIN_ENV) npm run lint --prefix web
	$(CHAIN_ENV) npm run typecheck --prefix web
	$(CHAIN_ENV) npm test --prefix web
	$(CHAIN_ENV) npm run build --prefix web

test: contracts api-check web-check

e2e:
	$(CHAIN_ENV) npm run e2e --prefix web

check: codegen-check contracts api-check web-check
	python3 scripts/abi_parity.py
	! git grep -nE 'VITE_[A-Z_]*(KEY|SECRET|PRIVATE)|0x[a-fA-F0-9]{64}' -- web api scripts ':!web/abi-smoke.mjs'
