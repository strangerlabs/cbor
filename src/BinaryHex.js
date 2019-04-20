'use strict'

/**
 * Binary Hex
 * @ignore
 */
class BinaryHex {
  constructor ($hex) {
    this.$hex = $hex
  }

  length () {
    return this.$hex.length / 2
  }

  toString (format) {
    if (!format || format === 'hex' || format === 16) {
      return this.$hex
    }

    if (format === 'utf-8' || format === 'utf8') {
      let encoded = ''

      for (let i = 0; i < this.$hex.length; i += 2) {
        encoded += '%' + this.$hex.substring(i, i + 2)
      }

      return decodeURIComponent(encoded)
    }

    if (format === 'latin') {
      let encoded = []

      for (let i = 0; i < this.$hex.length; i += 2) {
        encoded.push(parseInt(this.$hex.substring(i, i + 2), 16))
      }

      return String.fromCharCode.apply(String, encoded)
    }

    throw new Error(`Unrecognised format: ${format}`)
  }

  static fromLatinString (latinString) {
    let hex = ''

    for (let i = 0; i < latinString.length; i++) {
      let pair = latinString.charCodeAt(i).toString(16)

      if (pair.length === 1) {
        pair = "0" + pair
      }

      hex += pair
    }

    return new BinaryHex(hex)
  }

  static fromUtf8String (utf8String) {
    const encoded = encodeURIComponent(utf8String)
    let hex = ''

    for (let i = 0; i < encoded.length; i++) {
      if (encoded.charAt(i) === '%') {
        hex += encoded.substring(i + 1, i + 3)
        i += 2

      } else {
        let hexPair = encoded.charCodeAt(i).toString(16)

        if (hexPair.length < 2) {
          hexPair = "0" + hexPair
        }

        hex += hexPair
      }
    }

    return new BinaryHex(hex)
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = BinaryHex
