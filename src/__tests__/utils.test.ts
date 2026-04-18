import { describe, it, expect } from 'vitest'
import { formatAmount, formatDate, calcAge } from '@/lib/utils'

describe('formatAmount', () => {
  it('formats number with comma separators and 원', () => {
    expect(formatAmount(1000)).toBe('1,000원')
    expect(formatAmount(1000000)).toBe('1,000,000원')
  })

  it('handles zero', () => {
    expect(formatAmount(0)).toBe('0원')
  })

  it('handles negative numbers', () => {
    expect(formatAmount(-1000)).toBe('-1,000원')
  })
})

describe('formatDate', () => {
  it('formats date to YYYY.MM.DD format', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toBe('2024.01.15')
  })

  it('handles string input', () => {
    const result = formatDate('2024-03-05')
    expect(result).toBe('2024.03.05')
  })
})

describe('calcAge', () => {
  it('calculates age correctly', () => {
    const today = new Date()
    const birthYear = today.getFullYear() - 25
    const birthDate = new Date(birthYear, 0, 1)
    expect(calcAge(birthDate)).toBe(25)
  })

  it('handles birthday not yet occurred this year', () => {
    const today = new Date()
    const birthDate = new Date(today.getFullYear() - 25, 11, 31)
    if (today.getMonth() < 11 || (today.getMonth() === 11 && today.getDate() < 31)) {
      expect(calcAge(birthDate)).toBe(24)
    } else {
      expect(calcAge(birthDate)).toBe(25)
    }
  })
})
