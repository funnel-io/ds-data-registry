
SHELL=/bin/bash

.PHONY: clean setup funnel-source-type-config

clean:
	rm -rf node_modules
	rm -rf funnel-source-type-config

setup: package.json package-lock.json
	npm install
	mkdir -p funnel-source-type-config

run:
	node scripts/sync-sources.js

funnel-source-type-config:
	mkdir -p funnel-source-type-config
	cd funnel-source-type-config
	aws s3 sync s3://funnel-source-type-config/ ./funnel-source-type-config --include '*.json' --content-encoding gzip
	file funnel-source-type-config/* | grep 'gzip compressed data' | awk -F":" '{print $$1}' | xargs gunzip -S "" -f
