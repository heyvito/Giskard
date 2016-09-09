VERSION := $(shell node -e 'console.log(require("./version.json").version)')
all:
	@echo "Building and uploading 27labs/giskard:$(VERSION)"
	@docker build . -t "27labs/giskard:$(VERSION)"
	@docker tag "27labs/giskard:$(VERSION)" "27labs/giskard:latest"
	@echo ""
	@echo "Pushing..."
	@docker push 27labs/giskard:latest
	@docker push "27labs/giskard:$(VERSION)"
