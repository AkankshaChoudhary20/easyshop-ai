# EasyShop AI — short commands so you don't have to remember the long ones.
# Run "make" to see this list.

help:
	@echo ""
	@echo "EasyShop AI commands:"
	@echo "  make setup   create your .env file (first time only, generates a JWT_SECRET)"
	@echo "  make up      build and start everything"
	@echo "  make down    stop everything"
	@echo "  make logs    watch the logs"
	@echo "  make ps      show what is running"
	@echo "  make reset   wipe the database and start fresh"
	@echo "  make smoke   quick check that everything works (AI included)"
	@echo ""

setup:
	@test -f .env || cp .env.example .env
	@if grep -q '^JWT_SECRET=$$' .env; then \
		SECRET=$$(openssl rand -base64 32); \
		sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$$SECRET|" .env && rm -f .env.bak; \
		echo "Generated a JWT_SECRET in .env"; \
	fi
	@echo ".env is ready"

up: setup
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

reset:
	docker compose down -v
	docker compose up --build

smoke:
	@echo "app health:"
	curl -s http://localhost:3000/api/health
	@echo ""
	@echo "products:"
	curl -s "http://localhost:3000/api/products" | head -c 300
	@echo ""
	@echo "ai endpoint (expect a real result, or {\"error\":\"ai_unavailable\"} if no key is configured):"
	curl -s -X POST http://localhost:3000/api/ai/search -H "Content-Type: application/json" -d '{"query":"cheap waterproof bags under $30"}'
	@echo ""

.PHONY: help setup up down logs ps reset smoke
