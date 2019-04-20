'use strict'

/**
 * Writer
 * @ignore
 */
class Writer {
  writeByte () {
    throw new Error('writeByte not implemented')
  }

  result () {
    throw new Error('result not implemented')
  }

  writeFloat16 () {
    throw new Error('writeFloat16 not implemented')
  }

  writeFloat32 () {
    throw new Error('writeFloat32 not implemented')
  }

  writeFloat64 () {
    throw new Error('writeFloat64 not implemented')
  }

  writeUint16 (value) {
    this.writeByte((value >> 8) & 0xff)
    this.writeByte(value & 0xff)
  }

  writeUint32 (value) {
    this.writeUint16((value >> 16) & 0xffff)
    this.writeUint16(value & 0xffff)
  }

  writeUint64 (value) {
    if (value >= 9007199254740992 || value <= -9007199254740992) {
      throw new Error(`Cannot encode Uint64 of: ${value} magnitude to big (floating point errors)`)
    }

    this.writeUint32(Math.floor(value / 4294967296))
    this.writeUint32(value % 4294967296)
  }

  canWriteBinary () {
    return false
  }

  writeString () {
    throw new Error('writeString not implemented')
  }

  writeChunk () {
    throw new Error('writeChunk not implemented')
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Writer
