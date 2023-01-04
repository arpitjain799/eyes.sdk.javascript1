import assert from 'assert'
import {toSelfHealingReport} from '../../src/utils/to-self-healing-report'

describe('transform', () => {
  it('driver-session-metadata to self-healing-report', async () => {
    const input = [
      {successfulSelector: 'a', originalSelector: 'b'},
      {successfulSelector: 'b', originalSelector: 'c'},
      {successfulSelector: 'c', originalSelector: 'd'},
    ]
    toSelfHealingReport(input).operations.forEach((result, index) => {
      assert.deepStrictEqual(result.old, input[index].originalSelector)
      assert.deepStrictEqual(result.new, input[index].successfulSelector)
      assert(Date.parse(result.timestamp))
    })
  })
})
