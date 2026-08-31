.PHONY: install start test docker-build docker-run

install:
	npm install

start:
	npm start

test:
	npm test

docker-build:
	docker build -t snake-3d-cyber-grid .

docker-run:
	docker run -p 8003:8003 snake-3d-cyber-grid
