var assert = require('chai').assert

var api = require('../src')

describe('toCBOR', function () {
  it('replaces data', function () {
    var data = {
      "a": "b",
      toCBOR: () => {
        return ":)"
      }
    }

    const encoded = api.encode(data)
    const decoded = api.decode(encoded)

    assert.deepEqual(decoded, ":)")
  })
})
