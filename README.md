# CBOR _(@strangerlabs/cbor)_

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.com/strangerlabs/cbor.svg?branch=master)](https://travis-ci.com/strangerlabs/cbor)
[![codecov](https://codecov.io/gh/strangerlabs/cbor/branch/master/graph/badge.svg)](https://codecov.io/gh/strangerlabs/cbor)

> An ArrayBuffer implementation of CBOR for JavaScript

TODO: Fill out this long description.

## Table of Contents

- [CBOR _(@strangerlabs/cbor)_](#cbor-strangerlabscbor)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Usage](#usage)
  - [Maintainers](#maintainers)
  - [Contribute](#contribute)
  - [License](#license)

## Security

**NOTICE:** This library is currently experimental, not officially supported and should not be used in any production setting.

## Usage

```js
// Note: this library is currently unpublished
const CBOR = require('@strangerlabs/cbor')

const input = { foo: 'bar' }
const buffer = CBOR.encode(input)
const decoded = CBOR.decode(buffer)

assert.deepEqual(decoded, input)
```

## Maintainers

[@EternalDeiwos](https://github.com/EternalDeiwos)

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2019 Stranger Labs, Inc.
