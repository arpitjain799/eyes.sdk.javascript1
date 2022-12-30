import type {DriverSessionMetadata, SelfHealingReport} from '../types'

export function toSelfHealingReport(input: DriverSessionMetadata): SelfHealingReport {
  const result = {
    operations: []
  }
  input.forEach(item => {
    Object.entries(item).forEach(([a, b]) => {
      const date = new Date 
      result.operations.push({
        old: a,
        new: b,
        timestamp: date.toISOString(),
      })
    })
  })
  return result
}
