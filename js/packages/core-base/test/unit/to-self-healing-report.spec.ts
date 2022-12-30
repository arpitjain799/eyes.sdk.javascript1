import assert from 'assert'
import {toSelfHealingReport} from '../../src/utils/to-self-healing-report'

describe('transform', () => {
  it('driver-session-metadata to self-healing-report', async () => {
    const input = [
      {'a': 'b'},
      {'b': 'c'},
      {'c': 'd'},
    ]
    toSelfHealingReport(input).operations.forEach((result, index) => {
      assert.deepStrictEqual(result.old, Object.keys(input[index])[0])
      assert.deepStrictEqual(result.new, Object.values(input[index])[0])
      assert(Date.parse(result.timestamp))
    })
  })
})
