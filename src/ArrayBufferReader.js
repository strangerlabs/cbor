'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const Reader = require('./Reader')

/**
 * Array Buffer Reader
 * @ignore
 */
class ArrayBufferReader extends Reader {
  constructor (buffer) {
    super()
    this.buffer = buffer
    this.pos = 0
  }

  peekByte () {
    return new DataView(this.buffer).getUint8(this.pos)
  }

  readByte () {
    return new DataView(this.buffer).getUint8(this.pos++)
  }

  readChunk (length) {
    const result = new Uint8Array(new ArrayBuffer(length))
    result.set(new Uint8Array(this.buffer, this.pos, length))
    this.pos += length
    return result.buffer
  }

  readFloat32 () {
    const result = new DataView(this.buffer).getFloat32(this.pos)
    this.pos += 4
    return result
  }

  readFloat64 () {
    const result = new DataView(this.buffer).getFloat64(this.pos)
    this.pos += 8
    return result
  }

  readUint16 () {
    const result = new DataView(this.buffer).getUint16(this.pos)
    this.pos += 2
    return result
  }

  readUint32 () {
    const result = new DataView(this.buffer).getUint32(this.pos)
    this.pos += 4
    return result
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = ArrayBufferReader
