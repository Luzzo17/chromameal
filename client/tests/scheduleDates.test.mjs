import test from 'node:test'
import assert from 'node:assert/strict'
import { italianDateTime, italianTimeToUtc, shiftDate } from '../src/lib/scheduleDates.ts'

test('Italian winter and summer times have different UTC offsets', () => {
  assert.equal(italianTimeToUtc('2026-01-20T09:00'), '2026-01-20T08:00:00.000Z')
  assert.equal(italianTimeToUtc('2026-07-20T09:00'), '2026-07-20T07:00:00.000Z')
})

test('Italian midnight can belong to the previous UTC date', () => {
  assert.equal(italianTimeToUtc('2026-10-25T00:30'), '2026-10-24T22:30:00.000Z')
  assert.equal(italianDateTime('2026-10-24T22:30:00.000Z'), '2026-10-25T00:30')
})

test('nonexistent spring clock-change times are rejected', () => {
  assert.throws(() => italianTimeToUtc('2026-03-29T02:30'), /non esiste/)
})

test('repeated autumn time consistently uses its first occurrence', () => {
  assert.equal(italianTimeToUtc('2026-10-25T02:30'), '2026-10-25T00:30:00.000Z')
})

test('calendar navigation crosses months, years and DST without skipping dates', () => {
  assert.equal(shiftDate('2026-12-28', 6), '2027-01-03')
  assert.equal(shiftDate('2026-10-19', 6), '2026-10-25')
  assert.equal(shiftDate('2026-03-23', 7), '2026-03-30')
  assert.equal(shiftDate('2028-02-28', 1), '2028-02-29')
})

test('incomplete and impossible dates are rejected', () => {
  assert.throws(() => italianTimeToUtc(''), /complete/)
  assert.throws(() => italianTimeToUtc('2026-02-30T09:00'), /non valida/)
})
