'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const Reader = require('./Reader')

/**
 * Buffer Reader
 * @ignore
 */
class BufferReader extends Reader {
  constructor (buffer) {
    super()
    this.buffer = buffer
    this.pos = 0
  }

  peekByte () {
    return this.buffer[this.pos]
  }

  readByte () {
    return this.buffer[this.pos++]
  }

  readChunk (length) {
    const result = Buffer.alloc(length)
    this.buffer.copy(result, 0, this.pos, this.pos += length)
    return result
  }

  readFloat32 () {
    const result = this.buffer.readFloatBE(this.pos)
    this.pos += 4
    return result
  }

  readFloat64 () {
    const result = this.buffer.readDoubleBE(this.pos)
    this.pos += 8
    return result
  }

  readUint16 () {
    const result = this.buffer.readUInt16BE(this.pos)
    this.pos += 2
    return result
  }

  readUint32 () {
    const result = this.buffer.readUInt32BE(this.pos)
    this.pos += 4
    return result
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = BufferReader
