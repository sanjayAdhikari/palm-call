github_actions:
	@if [ ! -f .env ]; then echo "ERROR: .env file missing!"; exit 1; fi
	docker compose down --remove-orphans
	docker compose build
	docker compose up -d --force-recreate
	@dangling_images=$$(docker images -f "dangling=true" -q); \
	if [ -n "$$dangling_images" ]; then \
		docker rmi $$dangling_images || true; \
	fi

clear-unused:
	docker image prune