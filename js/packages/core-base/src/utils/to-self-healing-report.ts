import type {DriverSessionMetadata, SelfHealingReport} from '../types'

export function toSelfHealingReport(input: DriverSessionMetadata): SelfHealingReport {
  const result = {
    operations: []
  }
  input.forEach(item => {
    const date = new Date 
    result.operations.push({
      old: item?.originalSelector?.value,
      new: item?.successfulSelector?.value,
      timestamp: date.toISOString(),
    })
  })
  return result
}
