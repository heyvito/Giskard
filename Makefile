VERSION := $(shell cat package.json | grep version | sed -E 's/  "version": "(.*)",/\1/')
all:
	@echo "Building and uploading 27labs/giskard:$(VERSION)"
	@docker build . -t "27labs/giskard:$(VERSION)"
	@docker tag "27labs/giskard:$(VERSION)" "27labs/giskard:latest"
	@echo ""
	@echo "Pushing..."
	@docker push 27labs/giskard:latest
	@docker push "27labs/giskard:$(VERSION)"
