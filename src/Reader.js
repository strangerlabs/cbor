'use strict'

/**
 * Reader
 * @ignore
 */
class Reader {
  peekByte () {
    throw new Error('peekByte not implemented')
  }

  readByte () {
    throw new Error('readByte not implemented')
  }

  readChunk () {
    throw new Error('readChunk not implemented')
  }

  readFloat16 () {
    const half = this.readUint16()
    const exponent = (half & 0x7fff) >> 10
    const mantissa = half & 0x3ff
    const negative = half & 0x8000

    if (exponent === 0x1f) {
      if (mantissa === 0) {
        return negative ? -Infinity : Infinity
      }
      return NaN
    }

    const magnitude = exponent ? Math.pow(2, exponent - 25) * (1024 + mantissa) : Math.pow(2, -24) * mantissa
    return negative ? -magnitude : magnitude
  }

  readFloat32 () {
    const intValue = this.readUint32()
    const exponent = (intValue & 0x7fffffff) >> 23
    const mantissa = intValue & 0x7fffff
    const negative = intValue & 0x80000000

    if (exponent === 0xff) {
      if (mantissa === 0) {
        return negative ? -Infinity : Infinity
      }
      return NaN
    }

    const magnitude = exponent ? Math.pow(2, exponent - 23 - 127) * (8388608 + mantissa) : Math.pow(2, -23 - 126) * mantissa
    return negative ? -magnitude : magnitude
  }

  readFloat64 () {
    const int1 = this.readUint32(), int2 = this.readUint32()
    const exponent = (int1 >> 20) & 0x7ff
    const mantissa = (int1 & 0xfffff) * 4294967296 + int2
    const negative = int1 & 0x80000000

    if (exponent === 0x7ff) {
      if (mantissa === 0) {
        return negative ? -Infinity : Infinity
      }
      return NaN
    }

    const magnitude = exponent ? Math.pow(2, exponent - 52 - 1023) * (4503599627370496 + mantissa) : Math.pow(2, -52 - 1022) * mantissa
    return negative ? -magnitude : magnitude
  }

  readUint16 () {
    return this.readByte() * 256 + this.readByte()
  }

  readUint32 () {
    return this.readUint16() * 65536 + this.readUint16()
  }

  readUint64 () {
    return this.readUint32() * 4294967296 + this.readUint32()
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Reader
