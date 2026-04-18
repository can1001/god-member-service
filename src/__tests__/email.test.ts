import { describe, expect, it } from 'vitest'
import { normalizeEmail, sanitizeEmailInput, validateEmail } from '@/lib/email'

describe('sanitizeEmailInput', () => {
  it('removes Korean characters and whitespace from email input', () => {
    expect(sanitizeEmailInput('홍 Gil Dong @Example.com ')).toBe('gildong@example.com')
  })

  it('keeps allowed email characters', () => {
    expect(sanitizeEmailInput('Test.User+tag@example-domain.com')).toBe(
      'test.user+tag@example-domain.com'
    )
  })
})

describe('normalizeEmail', () => {
  it('normalizes email to lowercase ascii form', () => {
    expect(normalizeEmail(' Test.User@Example.COM ')).toBe('test.user@example.com')
  })
})

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('member.test+su@example.co.kr')).toBe(true)
  })

  it('rejects an invalid email format', () => {
    expect(validateEmail('member@example')).toBe(false)
  })

  it('rejects input that becomes incomplete after Korean removal', () => {
    expect(validateEmail('사용자@예시.컴')).toBe(false)
  })
})
