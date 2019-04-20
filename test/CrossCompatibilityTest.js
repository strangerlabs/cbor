const assert = require('chai').assert
const api = require('../src')
const nodeCBOR = require('cbor')
const syncCBOR = require('cbor-sync')

describe('Cross Compatibility', function () {
  const examples = [
    // Objects
    { data: {}, encoded: Buffer.from('a0', 'hex'), symmetric: true },
    { data: { "a": 1, "b": [2, 3] }, encoded: Buffer.from('a26161016162820203', 'hex'), symmetric: true },
    { data: ["a", { "b": "c" }], encoded: Buffer.from('826161a161626163', 'hex'), symmetric: true },
    { data: { "a": "A", "b": "B", "c": "C", "d": "D", "e": "E" }, encoded: Buffer.from('a56161614161626142616361436164614461656145', 'hex'), symmetric: true },

    // Variable-length objects
    { data: { "a": 1, "b": [2, 3] }, encoded: Buffer.from('bf61610161629f0203ffff', 'hex'), symmetric: false },
    { data: ["a", { "b": "c" }], encoded: Buffer.from('826161bf61626163ff', 'hex'), symmetric: false },
    { data: { "Fun": true, "Amt": -2 }, encoded: Buffer.from('bf6346756ef563416d7421ff', 'hex'), symmetric: false },

    // Arrays
    { data: [], encoded: Buffer.from('80', 'hex'), symmetric: true },
    { data: [1, 2, 3], encoded: Buffer.from('83010203', 'hex'), symmetric: true },
    { data: [1, [2, 3], [4, 5]], encoded: Buffer.from('8301820203820405', 'hex'), symmetric: true },
    {
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      encoded: Buffer.from('98190102030405060708090a0b0c0d0e0f101112131415161718181819', 'hex'),
      symmetric: true,
    },

    // Variable-length arrays
    { data: [1, [2, 3], [4, 5]], encoded: Buffer.from('9f018202039f0405ffff', 'hex'), symmetric: false },
    { data: [1, [2, 3], [4, 5]], encoded: Buffer.from('9f01820203820405ff', 'hex'), symmetric: false },
    { data: [1, [2, 3], [4, 5]], encoded: Buffer.from('83018202039f0405ff', 'hex'), symmetric: false },
    { data: [1, [2, 3], [4, 5]], encoded: Buffer.from('83019f0203ff820405', 'hex'), symmetric: false },

    // Basic types
    { data: false, encoded: Buffer.from('f4', 'hex'), symmetric: true },
    { data: true, encoded: Buffer.from('f5', 'hex'), symmetric: true },
    { data: null, encoded: Buffer.from('f6', 'hex'), symmetric: true },
    { data: undefined, encoded: Buffer.from('f7', 'hex'), symmetric: true },

    // Byte strings
    { data: Buffer.from('0255333A83fB3f', 'hex'), encoded: Buffer.from('470255333A83fB3f', 'hex'), symmetric: true },
    { data: Buffer.alloc(0), encoded: Buffer.from('40', 'hex'), symmetric: true },

    // Floating points
    { data: 1.1, encoded: Buffer.from('fb3ff199999999999a', 'hex'), symmetric: true },
    { data: 1.5, encoded: Buffer.from('f93e00', 'hex'), symmetric: false },
    { data: 3.4028234663852886e+38, encoded: Buffer.from('fa7f7fffff', 'hex'), symmetric: false },
    { data: 1.0e300, encoded: Buffer.from('fb7e37e43c8800759c', 'hex'), symmetric: true },
    { data: 5.960464477539063e-8, encoded: Buffer.from('f90001', 'hex'), symmetric: false },
    { data: 0.00006103515625, encoded: Buffer.from('f90400', 'hex'), symmetric: false },
    { data: -4.1, encoded: Buffer.from('fbc010666666666666', 'hex'), symmetric: true },

    { data: Infinity, encoded: Buffer.from('f97c00', 'hex'), symmetric: true, canonical: true, exclude_cbor_sync: true },
    { data: NaN, encoded: Buffer.from('f97e00', 'hex'), symmetric: true, canonical: true, exclude_cbor_sync: true },
    { data: -Infinity, encoded: Buffer.from('f9fc00', 'hex'), symmetric: true, canonical: true, exclude_cbor_sync: true },
    { data: Infinity, encoded: Buffer.from('fa7f800000', 'hex'), symmetric: false },
    { data: NaN, encoded: Buffer.from('fa7fc00000', 'hex'), symmetric: false },
    { data: -Infinity, encoded: Buffer.from('faff800000', 'hex'), symmetric: false },
    { data: Infinity, encoded: Buffer.from('fb7ff0000000000000', 'hex'), symmetric: false },
    { data: NaN, encoded: Buffer.from('fb7ff8000000000000', 'hex'), symmetric: false },
    { data: -Infinity, encoded: Buffer.from('fbfff0000000000000', 'hex'), symmetric: false },

    // Integers
    { data: 0, encoded: Buffer.from('00', 'hex'), symmetric: true },
    { data: 1, encoded: Buffer.from('01', 'hex'), symmetric: true },
    { data: 10, encoded: Buffer.from('0a', 'hex'), symmetric: true },
    { data: 23, encoded: Buffer.from('17', 'hex'), symmetric: true },
    { data: 24, encoded: Buffer.from('1818', 'hex'), symmetric: true },
    { data: 25, encoded: Buffer.from('1819', 'hex'), symmetric: true },
    { data: 100, encoded: Buffer.from('1864', 'hex'), symmetric: true },
    { data: 1000, encoded: Buffer.from('1903e8', 'hex'), symmetric: true },
    { data: 1000000, encoded: Buffer.from('1a000f4240', 'hex'), symmetric: true },
    { data: 1000000000000, encoded: Buffer.from('1b000000e8d4a51000', 'hex'), symmetric: true },
    //{data: 18446744073709551615, encoded: Buffer.from('00', 'hex'), symmetric: true}, // Untestable in JS
    //{data: 18446744073709551616, encoded: Buffer.from('00', 'hex'), symmetric: true}, // Untestable in JS
    //{data: -18446744073709551616, encoded: Buffer.from('00', 'hex'), symmetric: true}, // Untestable in JS
    //{data: -18446744073709551617, encoded: Buffer.from('00', 'hex'), symmetric: true}, // Untestable in JS
    { data: -1, encoded: Buffer.from('20', 'hex'), symmetric: true },
    { data: -10, encoded: Buffer.from('29', 'hex'), symmetric: true },
    { data: -100, encoded: Buffer.from('3863', 'hex'), symmetric: true },
    { data: -1000, encoded: Buffer.from('3903e7', 'hex'), symmetric: true },

    // Strings
    { data: "", encoded: Buffer.from('60', 'hex'), symmetric: true },
    { data: "a", encoded: Buffer.from('6161', 'hex'), symmetric: true },
    { data: "IETF", encoded: Buffer.from('6449455446', 'hex'), symmetric: true },
    { data: "\"\\", encoded: Buffer.from('62225c', 'hex'), symmetric: true },
    { data: "\u00fc", encoded: Buffer.from('62c3bc', 'hex'), symmetric: true },
    { data: "\u6c34", encoded: Buffer.from('63e6b0b4', 'hex'), symmetric: true },
    { data: "\ud800\udd51", encoded: Buffer.from('64f0908591', 'hex'), symmetric: true },
  ]

  describe('Node CBOR', function () {
    examples.forEach((example, index) => {
      if (example.exclude_cbor_sync) {
        it(`Example ${index} decode`)
        it(`Example ${index} encode`)
        it(`Example ${index} external encode, internal decode`)
        it(`Example ${index} internal encode, external decode`)
        return
      }

      it(`Example ${index} decode`, async () => {
        const local_decoded = api.decode(example.encoded)
        const external_decoded = await nodeCBOR.decodeFirst(example.encoded)
        assert.deepEqual(local_decoded instanceof ArrayBuffer ? Buffer.from(local_decoded) : local_decoded, external_decoded)
      })

      it(`Example ${index} encode`, async () => {
        const local_encoded = api.encode(example.data)
        const external_encoded = await nodeCBOR.encode(example.data)
        assert.deepEqual(Buffer.from(local_encoded), external_encoded)
      })

      if (example.symmetric) {
        it(`Example ${index} external encode, internal decode`, async () => {
          const external_encoded = await nodeCBOR.encode(example.data)
          const local_decoded = api.decode(new Uint8Array(external_encoded).buffer)
          assert.deepEqual(external_encoded, example.encoded)
          assert.deepEqual(local_decoded instanceof ArrayBuffer ? Buffer.from(local_decoded) : local_decoded, example.data)
        })

        it(`Example ${index} internal encode, external decode`, async () => {
          const local_encoded = api.encode(example.data)
          const external_decoded = await nodeCBOR.decodeFirst(Buffer.from(local_encoded))
          assert.deepEqual(Buffer.from(local_encoded), example.encoded)
          assert.deepEqual(external_decoded, example.data)
        })

        if (example.canonical) {
          it(`Example ${index} canonical encode`, async () => {
            const local_encoded = api.encode(example.data)
            const external_encoded = await nodeCBOR.encodeCanonical(example.data)
            assert.deepEqual(Buffer.from(local_encoded), external_encoded)
          })

          if (example.symmetric) {
            it(`Example ${index} external canonical encode, internal decode`, async () => {
              const external_encoded = await nodeCBOR.encodeCanonical(example.data)
              const local_decoded = api.decode(new Uint8Array(external_encoded).buffer)
              assert.deepEqual(external_encoded, example.encoded)
              assert.deepEqual(local_decoded instanceof ArrayBuffer ? Buffer.from(local_decoded) : local_decoded, example.data)
            })

          } else {
            it(`Example ${index} external canonical encode, internal decode`)
          }

        } else {
          it(`Example ${index} canonical encode`)
          it(`Example ${index} external canonical encode, internal decode`)
        }

      } else {
        it(`Example ${index} external encode, internal decode`)
        it(`Example ${index} internal encode, external decode`)
      }
    })
  })

  describe('CBOR Sync', function () {
    examples.forEach((example, index) => {
      if (example.exclude_cbor_sync) {
        it(`Example ${index} decode`)
        it(`Example ${index} encode`)
        it(`Example ${index} external encode, internal decode`)
        it(`Example ${index} internal encode, external decode`)
        return
      }

      it(`Example ${index} decode`, async () => {
        const local_decoded = api.decode(example.encoded)
        const external_decoded = await syncCBOR.decode(example.encoded)
        assert.deepEqual(local_decoded instanceof ArrayBuffer ? Buffer.from(local_decoded) : local_decoded, external_decoded)
      })

      if (example.symmetric) {
        it(`Example ${index} encode`, async () => {
          const local_encoded = api.encode(example.data)
          const external_encoded = await syncCBOR.encode(example.data)
          assert.deepEqual(Buffer.from(local_encoded), external_encoded)
        })

        it(`Example ${index} external encode, internal decode`, async () => {
          const external_encoded = await syncCBOR.encode(example.data)
          const local_decoded = api.decode(new Uint8Array(external_encoded).buffer)
          assert.deepEqual(external_encoded, example.encoded)
          assert.deepEqual(local_decoded instanceof ArrayBuffer ? Buffer.from(local_decoded) : local_decoded, example.data)
        })

        it(`Example ${index} internal encode, external decode`, async () => {
          const local_encoded = api.encode(example.data)
          const external_decoded = await syncCBOR.decode(Buffer.from(local_encoded))
          assert.deepEqual(Buffer.from(local_encoded), example.encoded)
          assert.deepEqual(external_decoded, example.data)
        })

      } else {
        it(`Example ${index} encode`)
        it(`Example ${index} external encode, internal decode`)
        it(`Example ${index} internal encode, external decode`)
      }
    })
  })
})
