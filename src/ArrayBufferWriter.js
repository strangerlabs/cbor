'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const Writer = require('./Writer')

/**
 * ArrayBufferWriter
 * @ignore
 */
class ArrayBufferWriter extends Writer {
  constructor () {
    super()
    this.byteLength = 0
    this.defaultBufferLength = 16384 // 16k
    this.latestBuffer = new ArrayBuffer(this.defaultBufferLength)
    this.latestBufferOffset = 0
    this.completeBuffers = []

    // For float16 hack
    this.floatView = new Float32Array(1)
    this.int32View = new Int32Array(this.floatView.buffer)
  }

  writeByte (value) {
    const buffer = new Uint8Array(this.latestBuffer)
    buffer[this.latestBufferOffset++] = value

    if (this.latestBufferOffset >= this.latestBuffer.byteLength) {
      this.completeBuffers.push(this.latestBuffer)
      this.latestBuffer = new ArrayBuffer(this.defaultBufferLength)
      this.latestBufferOffset = 0
    }

    this.byteLength++
  }

  result () {
    // Copies them all into a single Buffer
    const result = new Uint8Array(new ArrayBuffer(this.byteLength))
    let offset = 0

    for (let i = 0; i < this.completeBuffers.length; i++) {
      const buffer = this.completeBuffers[i]
      result.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    if (this.latestBufferOffset) {
      const slice = new Uint8Array(this.latestBuffer, 0, this.latestBufferOffset)
      result.set(slice, offset)
    }

    return result.buffer
  }

  writeFloat16 (value) {
    const buffer = new Uint16Array(1)

    this.floatView[0] = value
    let x = this.int32View[0]

    let bits = (x >> 16) & 0x8000 /* Get the sign */
    let m = (x >> 12) & 0x07ff /* Keep one extra bit for rounding */
    let e = (x >> 23) & 0xff /* Using int is faster here */

    /* If zero, or denormal, or exponent underflows too much for a denormal
     * half, return signed zero. */
    if (e < 103) {
      return bits
    }

    /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
    if (e > 142) {
      bits |= 0x7c00
      /* If exponent was 0xff and one mantissa bit was set, it means NaN,
       * not Inf, so make sure we set one mantissa bit too. */
      bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff)
      return bits
    }

    /* If exponent underflows but not too much, return a denormal */
    if (e < 113) {
      m |= 0x0800
      /* Extra rounding may overflow and set mantissa to 0 and exponent
       * to 1, which is OK. */
      bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1)
      return bits
    }

    bits |= ((e - 112) << 10) | (m >> 1)
    /* Extra rounding. An overflow will set mantissa to 0 and increment
     * the exponent, which is OK. */
    bits += m & 1

    buffer[0] = bits
    const array = new Uint8Array(buffer.buffer)
    array.reverse()
    this.writeBuffer(buffer.buffer)
  }

  writeFloat32 (value) {
    const buffer = new Float32Array([value])
    const array = new Uint8Array(buffer.buffer)
    array.reverse()
    this.writeBuffer(buffer.buffer)
  }

  writeFloat64 (value) {
    const buffer = new Float64Array([value])
    const array = new Uint8Array(buffer.buffer)
    array.reverse()
    this.writeBuffer(buffer.buffer)
  }

  canWriteBinary (data) {
    return data && data.byteLength !== undefined
  }

  writeBinary (buffer, lengthFunc) {
    lengthFunc(buffer.byteLength)
    this.writeBuffer(buffer)
  }

  writeBuffer (chunk) {
    if (!chunk || chunk.byteLength === undefined) {
      throw new TypeError('ArrayBufferWriter only accepts ArrayBuffers and Typed Arrays')
    }

    if (!this.latestBufferOffset) {
      this.completeBuffers.push(chunk)

    } else if (this.latestBuffer.byteLength - this.latestBufferOffset >= chunk.byteLength) {
      const buffer = new Uint8Array(this.latestBuffer, this.latestBufferOffset)
      buffer.set(new Uint8Array(chunk))
      this.latestBufferOffset += chunk.byteLength

      if (this.latestBufferOffset >= this.latestBuffer.byteLength) {
        this.completeBuffers.push(this.latestBuffer)
        this.latestBuffer = new ArrayBuffer(this.defaultBufferLength)
        this.latestBufferOffset = 0
      }

    } else {
      this.completeBuffers.push(this.latestBuffer.slice(0, this.latestBufferOffset))
      this.completeBuffers.push(chunk)
      this.latestBuffer = new ArrayBuffer(this.defaultBufferLength)
      this.latestBufferOffset = 0
    }

    this.byteLength += chunk.byteLength
  }

  writeString (string, lengthFunc) {
    let buffer

    if (typeof TextEncoder === 'function') {
      buffer = new TextEncoder('utf8').encode(string)
    } else if (typeof Buffer === 'function') {
      buffer = new Uint8Array(Buffer.from(string, 'utf8'))
    }

    lengthFunc(buffer.byteLength)
    this.writeBuffer(buffer.buffer)
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = ArrayBufferWriter
