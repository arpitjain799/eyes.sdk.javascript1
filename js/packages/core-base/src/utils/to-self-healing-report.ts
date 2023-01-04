import type {DriverSessionMetadata, SelfHealingReport} from '../types'

export function toSelfHealingReport(input: DriverSessionMetadata): SelfHealingReport {
  const result = {
    operations: []
  }
  input.forEach(item => {
    const date = new Date 
    result.operations.push({
      old: item.originalSelector,
      new: item.successfulSelector,
      timestamp: date.toISOString(),
    })
  })
  return result
}
