#!/usr/bin/env zsh
# pushd ../node; make; popd
NODE_DEBUG=* ./node /Users/ernest/.nvm/versions/node/v18.17.1/bin/npx mocha test/execute/execute-spec.ts
