import assert from 'assert'
import {toSelfHealingReport} from '../../src/utils/to-self-healing-report'

describe('transform', () => {
  it('driver-session-metadata to self-healing-report', async () => {
    const input = [
      {successfulSelector: 'a', unsuccessfulSelector: 'b'},
      {successfulSelector: 'b', unsuccessfulSelector: 'c'},
      {successfulSelector: 'c', unsuccessfulSelector: 'd'},
    ]
    toSelfHealingReport(input).operations.forEach((result, index) => {
      assert.deepStrictEqual(result.old, input[index].unsuccessfulSelector)
      assert.deepStrictEqual(result.new, input[index].successfulSelector)
      assert(Date.parse(result.timestamp))
    })
  })
})
