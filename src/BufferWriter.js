'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const Writer = require('./Writer')

/**
 * BufferWriter
 * @ignore
 */
class BufferWriter extends Writer {
  constructor (stringFormat) {
    super()
    this.byteLength = 0
    this.defaultBufferLength = 16384 // 16k
    this.latestBuffer = Buffer.alloc(this.defaultBufferLength)
    this.latestBufferOffset = 0
    this.completeBuffers = []
    this.stringFormat = stringFormat
  }

  writeByte (value) {
    this.latestBuffer[this.latestBufferOffset++] = value

    if (this.latestBufferOffset >= this.latestBuffer.length) {
      this.completeBuffers.push(this.latestBuffer)
      this.latestBuffer = Buffer.alloc(this.defaultBufferLength)
      this.latestBufferOffset = 0
    }

    this.byteLength++
  }

  result () {
    // Copies them all into a single Buffer
    const result = Buffer.alloc(this.byteLength)
    let offset = 0

    for (let i = 0; i < this.completeBuffers.length; i++) {
      const buffer = this.completeBuffers[i]
      buffer.copy(result, offset, 0, buffer.length)
      offset += buffer.length
    }

    if (this.latestBufferOffset) {
      this.latestBuffer.copy(result, offset, 0, this.latestBufferOffset)
    }

    if (this.stringFormat) {
      return result.toString(this.stringFormat)
    }

    return result
  }

  writeFloat32 (value) {
    const buffer = Buffer.alloc(4)
    buffer.writeFloatBE(value, 0)
    this.writeBuffer(buffer)
  }

  writeFloat64 (value) {
    const buffer = Buffer.alloc(8)
    buffer.writeDoubleBE(value, 0)
    this.writeBuffer(buffer)
  }

  canWriteBinary (data) {
    return Buffer.isBuffer(data)
  }

  writeBinary (buffer, lengthFunc) {
    lengthFunc(buffer.length)
    this.writeBuffer(buffer)
  }

  writeBuffer (chunk) {
    if (!Buffer.isBuffer(chunk)) {
      throw new TypeError('BufferWriter only accepts Buffers')
    }

    if (!this.latestBufferOffset) {
      this.completeBuffers.push(chunk)

    } else if (this.latestBuffer.length - this.latestBufferOffset >= chunk.length) {
      chunk.copy(this.latestBuffer, this.latestBufferOffset)
      this.latestBufferOffset += chunk.length

      if (this.latestBufferOffset >= this.latestBuffer.length) {
        this.completeBuffers.push(this.latestBuffer)
        this.latestBuffer = Buffer.alloc(this.defaultBufferLength)
        this.latestBufferOffset = 0
      }

    } else {
      this.completeBuffers.push(this.latestBuffer.slice(0, this.latestBufferOffset))
      this.completeBuffers.push(chunk)
      this.latestBuffer = Buffer.alloc(this.defaultBufferLength)
      this.latestBufferOffset = 0
    }

    this.byteLength += chunk.length
  }

  writeString (string, lengthFunc) {
    const buffer = Buffer.from(string, 'utf-8')
    lengthFunc(buffer.length)
    this.writeBuffer(buffer)
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = BufferWriter
