'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const Reader = require('./Reader')
const BinaryHex = require('./BinaryHex')

/**
 * Hex Reader
 * @ignore
 */
class HexReader extends Reader {
  constructor (hex) {
    super()
    this.hex = hex
    this.pos = 0
  }

  peekByte () {
    const pair = this.hex.substring(this.pos, 2)
    return parseInt(pair, 16)
  }

  readByte () {
    const pair = this.hex.substring(this.pos, this.pos + 2)
    this.pos += 2
    return parseInt(pair, 16)
  }

  readChunk (length) {
    const hex = this.hex.substring(this.pos, this.pos + length * 2)
    this.pos += length * 2

    if (typeof Buffer === 'function') {
      return Buffer.from(hex, 'hex') // TODO replace Node Buffer
    }

    return new BinaryHex(hex)
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = HexReader
