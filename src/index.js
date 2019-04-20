'use strict'

/**
 * Module Dependencies
 * @ignore
 */
const BinaryHex = require('./BinaryHex')
const Reader = require('./Reader')
const Writer = require('./Writer')
const BufferReader = require('./BufferReader')
const BufferWriter = require('./BufferWriter')
const HexReader = require('./HexReader')
const HexWriter = require('./HexWriter')
const ArrayBufferReader = require('./ArrayBufferReader')
const ArrayBufferWriter = require('./ArrayBufferWriter')

/**
 * Globals
 * @ignore
 */
const semanticEncoders = []
const semanticDecoders = {}
const config = {
  useToJSON: true,
  useNodeBuffer: false,
}

// Just a unique object, that won't compare strictly equal to anything else
const stopCode = new Error()

/**
 * Library
 * @ignore
 */
class CBOR {
  constructor () {
    this.readerFunctions = []
    this.writerFunctions = []

    // Add readers / writers
    if (typeof Buffer === 'function' && config.useNodeBuffer) {
      this.addReader((data, format) => {
        if (Buffer.isBuffer(data)) {
          return new BufferReader(data)
        }
        if (format === 'hex' || format === 'base64') {
          const buffer = Buffer.from(data, format)
          return new BufferReader(buffer)
        }
      })

      this.addWriter(format => {
        if (!format || format === 'buffer') {
          return new BufferWriter()
        } else if (format === 'hex' || format === 'base64') {
          return new BufferWriter(format)
        }
      })

    } else {
      this.addReader((data, format) => {
        if (data instanceof ArrayBuffer) {
          return new ArrayBufferReader(data)
        }

        if (typeof Buffer === 'function' && Buffer.isBuffer(data)) {
          return new ArrayBufferReader(Uint8Array.from(data).buffer)
        }

        if (data.byteLength !== undefined && ArrayBuffer.isView(data)) {
          return new ArrayBufferReader(data.buffer)
        }

        if (format === 'hex' || format === 'base64') {
          const buffer = Buffer.from(data, format) // TODO remove dependency on Node Buffer
          return new ArrayBufferReader(Uint8Array.from(buffer).buffer)
        }
      })

      this.addWriter(format => {
        if (!format || format === 'buffer') {
          return new ArrayBufferWriter()
        }
      })
    }

    this.addReader((data, format) => {
      if (data instanceof BinaryHex || data.$hex) {
        return new HexReader(data.$hex)
      }
      if (format === 'hex') {
        return new HexReader(data)
      }
    })

    this.addWriter(format => {
      if (format === 'hex') {
        return new HexWriter()
      }
    })
  }

  static readHeaderRaw (reader) {
    const firstByte = reader.readByte()
    const majorType = firstByte >> 5
    const value = firstByte & 0x1f
    return { type: majorType, value: value }
  }

  static valueFromHeader (header, reader) {
    const value = header.value

    if (value < 24) {
      return value
    } else if (value == 24) {
      return reader.readByte()
    } else if (value == 25) {
      return reader.readUint16()
    } else if (value == 26) {
      return reader.readUint32()
    } else if (value == 27) {
      return reader.readUint64()
    } else if (value == 31) {
      return null
    }

    throw new Error(`Additional info: ${value} not implemented`)
  }

  static writeHeaderRaw (type, value, writer) {
    writer.writeByte((type << 5) | value)
  }

  static writeHeader (type, value, writer) {
    const firstByte = type << 5

    if (value < 24) {
      writer.writeByte(firstByte | value)

    } else if (value < 256) {
      writer.writeByte(firstByte | 24)
      writer.writeByte(value)

    } else if (value < 65536) {
      writer.writeByte(firstByte | 25)
      writer.writeUint16(value)

    } else if (value < 4294967296) {
      writer.writeByte(firstByte | 26)
      writer.writeUint32(value)

    } else {
      writer.writeByte(firstByte | 27)
      writer.writeUint64(value)
    }
  }

  static decodeReader (reader) {
    const header = CBOR.readHeaderRaw(reader)
    let result

    switch (header.type) {
      case 0:
        return CBOR.valueFromHeader(header, reader)

      case 1:
        return -1 - CBOR.valueFromHeader(header, reader)

      case 2:
        return reader.readChunk(CBOR.valueFromHeader(header, reader))

      case 3:
        const buffer = reader.readChunk(CBOR.valueFromHeader(header, reader))

        if (typeof TextDecoder === 'function') {
          return new TextDecoder('utf8').decode(buffer)

        } else if (typeof Buffer === 'function') {
          return Buffer.from(buffer).toString('utf8')
        }

        throw new Error('No supported text encoding methods')

      case 4:
      case 5:
        let arrayLength = CBOR.valueFromHeader(header, reader)
        result = []

        if (arrayLength !== null) {
          if (header.type === 5) {
            arrayLength *= 2
          }

          for (let i = 0; i < arrayLength; i++) {
            result[i] = CBOR.decodeReader(reader)
          }

        } else {
          let item
          while ((item = CBOR.decodeReader(reader)) !== stopCode) {
            result.push(item)
          }
        }

        if (header.type === 5) {
          const objResult = {}

          for (let i = 0; i < result.length; i += 2) {
            objResult[result[i]] = result[i + 1]
          }

          return objResult

        } else {
          return result
        }

      case 6:
        const tag = CBOR.valueFromHeader(header, reader)
        const decoder = semanticDecoders[tag]
        result = CBOR.decodeReader(reader)
        return decoder ? decoder(result) : result

      case 7:
        if (header.value === 25) {
          return reader.readFloat16()
        } else if (header.value === 26) {
          return reader.readFloat32()
        } else if (header.value === 27) {
          return reader.readFloat64()
        }

        switch (CBOR.valueFromHeader(header, reader)) {
          case 20:
            return false

          case 21:
            return true

          case 22:
            return null

          case 23:
            return undefined

          case null:
            return stopCode

          default:
            throw new Error(`Unknown fixed value: ${header.value}`)
        }
      default:
        throw new Error(`Unsupported header: ${JSON.stringify(header)}`)
    }
  }

  static encodeWriter (data, writer) {
    for (let i = 0; i < semanticEncoders.length; i++) {
      const replacement = semanticEncoders[i].fn(data)

      if (replacement !== undefined) {
        CBOR.writeHeader(6, semanticEncoders[i].tag, writer)
        return CBOR.encodeWriter(replacement, writer)
      }
    }

    if (data && typeof data.toCBOR === 'function') {
      data = data.toCBOR()
    }

    if (data === false) {
      CBOR.writeHeader(7, 20, writer)

    } else if (data === true) {
      CBOR.writeHeader(7, 21, writer)

    } else if (data === null) {
      CBOR.writeHeader(7, 22, writer)

    } else if (data === undefined) {
      CBOR.writeHeader(7, 23, writer)

    } else if (typeof data === 'number') {
      if (Math.floor(data) === data && data < 9007199254740992 && data > -9007199254740992) {
        // Integer
        if (data < 0) {
          CBOR.writeHeader(1, -1 - data, writer)

        } else {
          CBOR.writeHeader(0, data, writer)
        }

      } else if (Number.isNaN(data)) {
        CBOR.writeHeaderRaw(7, 25, writer)
        writer.writeUint16(0x7e00)

      } else if (!Number.isFinite(data)) {
        CBOR.writeHeaderRaw(7, 25, writer)

        if (data < 0) {
          writer.writeUint16(0xfc00)
        } else {
          writer.writeUint16(0x7c00)
        }

      } else {
        CBOR.writeHeaderRaw(7, 27, writer)
        writer.writeFloat64(data)
      }

    } else if (typeof data === 'string') {
      writer.writeString(data, function (length) {
        CBOR.writeHeader(3, length, writer)
      })

    } else if (writer.canWriteBinary(data)) {
      writer.writeBinary(data, function (length) {
        CBOR.writeHeader(2, length, writer)
      })

    } else if (typeof data === 'object') {
      if (config.useToJSON && typeof data.toJSON === 'function') {
        data = data.toJSON()
      }

      if (Array.isArray(data)) {
        CBOR.writeHeader(4, data.length, writer)

        for (let i = 0; i < data.length; i++) {
          CBOR.encodeWriter(data[i], writer)
        }

      } else {
        const keys = Object.keys(data)
        CBOR.writeHeader(5, keys.length, writer)

        for (let i = 0; i < keys.length; i++) {
          CBOR.encodeWriter(keys[i], writer)
          CBOR.encodeWriter(data[keys[i]], writer)
        }
      }

    } else {
      throw new Error(`CBOR encoding not supported: ${data}`)
    }
  }

  get Reader () {
    return Reader
  }

  get Writer () {
    return Writer
  }

  addWriter (format, writerFunction) {
    if (typeof format === 'string') {
      this.writerFunctions.push(f => {
        if (format === f) {
          return writerFunction(f)
        }
      })

    } else {
      this.writerFunctions.push(format)
    }
  }

  addReader (format, readerFunction) {
    if (typeof format === 'string') {
      this.readerFunctions.push((data, f) => {
        if (format === f) {
          return readerFunction(data, f)
        }
      })

    } else {
      this.readerFunctions.push(format)
    }
  }

  encode (data, format) {
    for (let i = 0; i < this.writerFunctions.length; i++) {
      const func = this.writerFunctions[i]
      const writer = func(format)

      if (writer) {
        CBOR.encodeWriter(data, writer)
        return writer.result()
      }
    }

    throw new Error(`Unsupported output format: ${format}`)
  }

  decode (data, format) {
    for (let i = 0; i < this.readerFunctions.length; i++) {
      const func = this.readerFunctions[i]
      const reader = func(data, format)

      if (reader) {
        return CBOR.decodeReader(reader)
      }
    }

    throw new Error(`Unsupported input format: ${format}`)
  }

  addSemanticEncode (tag, fn) {
    if (typeof tag !== 'number' || tag % 1 !== 0 || tag < 0) {
      throw new Error('Tag must be a positive integer')
    }

    semanticEncoders.push({ tag: tag, fn: fn })
    return this
  }

  addSemanticDecode (tag, fn) {
    if (typeof tag !== 'number' || tag % 1 !== 0 || tag < 0) {
      throw new Error('Tag must be a positive integer')
    }

    semanticDecoders[tag] = fn
    return this
  }

  setConfig (options = {}) {
    Object.assign(config, options)
  }
}

const instance = new CBOR()

// Add basic semantic encoding functions
instance.addSemanticEncode(0, data => {
  if (data instanceof Date) {
    return data.toISOString()
  }

}).addSemanticDecode(0, isoString => {
  return new Date(isoString)

}).addSemanticDecode(1, timestamp => {
  return new Date(timestamp)
})

/**
 * Exports
 * @ignore
 */
if (module && module.exports) {
  // Node
  module.exports = instance

} else {
  // Browser
  global.CBOR = instance
}
