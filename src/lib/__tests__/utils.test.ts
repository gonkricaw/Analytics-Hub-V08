import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  formatDate,
  formatNumber,
  truncateText,
  generateSlug,
  validateEmail,
  validatePassword,
  debounce,
  sanitizeHtml,
  deepClone,
  isEmpty,
  getInitials,
  isValidUrl,
  calculatePercentageChange,
  extractDomain
} from '../utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should handle invalid date', () => {
      const result = formatDate(new Date('invalid'))
      expect(result).toContain('Invalid Date')
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50)
      expect(calculatePercentageChange(0, 100)).toBe(100)
      expect(calculatePercentageChange(100, 0)).toBe(-100)
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      const text = 'This is a very long text that should be truncated'
      expect(truncateText(text, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })
  })

  describe('generateSlug', () => {
    it('should generate slug correctly', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world')
      expect(generateSlug('Test & Example')).toBe('test-example')
    })
  })

  describe('validateEmail', () => {
    it('should validate email correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate password correctly', () => {
      const validResult = validatePassword('Password123!')
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)
      
      const invalidResult = validatePassword('weak')
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
      
      const emptyResult = validatePassword('')
      expect(emptyResult.isValid).toBe(false)
      expect(emptyResult.errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeHtml', () => {
    it('should sanitize HTML correctly', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>Normal text')).toBe('Normal text')
      expect(sanitizeHtml('Normal text')).toBe('Normal text')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      setTimeout(() => {
        expect(callCount).toBe(1)
        done()
      }, 150)
    })
  })

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)
      
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })
  })

  describe('isEmpty', () => {
    it('should check if value is empty', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty('')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
      expect(isEmpty('test')).toBe(false)
      expect(isEmpty([1])).toBe(false)
    })
  })

  describe('getInitials', () => {
    it('should get initials correctly', () => {
      expect(getInitials('John', 'Doe')).toBe('JD')
      expect(getInitials('John')).toBe('J')
      expect(getInitials('')).toBe('')
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com')
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com')
      expect(extractDomain('invalid-url')).toBe('')
    })
  })


})