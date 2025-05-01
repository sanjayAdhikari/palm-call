# List running Docker containers
list-running-containers:
	docker ps

# List all Docker containers (including stopped ones)
list-all-containers:
	docker ps -a

# Bring up Docker Compose services and build if necessary (for production)
build-up:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.yml up -d
	docker exec -it evolv_backend_system npm run seed_start

# Bring up Docker Compose services and build if necessary (for production)
update:
	git config --global credential.helper 'cache --timeout=900'
	git pull
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.yml up -d
	docker exec -it evolv_backend_system npm run seed_start

# Bring down Docker Compose services (for production)
down:
	docker-compose -f docker-compose.production.yml down

# Build Docker Compose services (for production)
build:
	docker-compose -f docker-compose.production.yml build

# Run the seed script in the 'backend_system' container
seed:
	docker exec -it evolv_backend_system npm run seed_start

prune:
	docker system prune

github_actions:
	docker build --rm -t evolv_backend:v1 .
	docker stop evolv_backend_system || true
	docker rm evolv_backend_system || true
	docker rmi $(docker images -f "dangling=true" -q) || true
	docker run -p 5000:5000 --env-file .env --name evolv_backend_system -d evolv_backend:v1

clear-unused:
	docker image prune
