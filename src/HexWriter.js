'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const BinaryHex = require('./BinaryHex')
const Writer = require('./Writer')

/**
 * Hex Writer
 * @ignore
 */
class HexWriter extends Writer {
  constructor (finalFormat) {
    super()
    this.$hex = ''
    this.finalFormat = finalFormat || 'hex'
  }

  writeByte (value) {
    if (value < 0 || value > 255) {
      throw new Error(`Byte value out of range: ${value}`)
    }

    let hex = value.toString(16)

    if (hex.length == 1) {
      hex = '0' + hex
    }

    this.$hex += hex
  }

  result () {
    if (this.finalFormat === 'buffer' && typeof Buffer === 'function') {
      return Buffer.from(this.$hex, 'hex')
    }

    return new BinaryHex(this.$hex).toString(this.finalFormat)
  }

  canWriteBinary (data) {
    return data instanceof BinaryHex || (typeof Buffer === 'function' && Buffer.isBuffer(data))
  }

  writeBinary (chunk, lengthFunction) {
    if (chunk instanceof BinaryHex) {
      lengthFunction(chunk.length())
      this.$hex += chunk.$hex

    } else if (typeof Buffer === 'function' && Buffer.isBuffer(chunk)) {
      lengthFunction(chunk.length)
      this.$hex += chunk.toString('hex')

    } else {
      throw new TypeError('HexWriter only accepts BinaryHex or Buffers')
    }
  }

  writeString (string, lengthFunction) {
    var buffer = BinaryHex.fromUtf8String(string)
    lengthFunction(buffer.length())
    this.$hex += buffer.$hex
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = HexWriter
