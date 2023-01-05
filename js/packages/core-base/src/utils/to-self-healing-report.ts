import type {SelfHealingEvent, SelfHealingReport} from '../types'

export function toSelfHealingReport(input: SelfHealingEvent[]): SelfHealingReport {
  const result = {
    operations: [],
  }
  input.forEach(item => {
    const date = new Date()
    result.operations.push({
      old: item?.originalSelector,
      new: item?.successfulSelector,
      timestamp: date.toISOString(),
    })
  })
  return result
}
