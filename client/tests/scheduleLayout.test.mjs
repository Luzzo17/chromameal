import test from 'node:test'
import assert from 'node:assert/strict'
import { layoutEvents } from '../src/lib/scheduleLayout.ts'

test('isolated events use the full width when another cluster overlaps later', () => {
  const placed = layoutEvents([
    { id: 'morning', start: 8, end: 9 },
    { id: 'afternoon-a', start: 14, end: 16 },
    { id: 'afternoon-b', start: 15, end: 17 },
  ])

  assert.deepEqual(placed.map(({ id, laneCount }) => [id, laneCount]), [
    ['morning', 1],
    ['afternoon-a', 2],
    ['afternoon-b', 2],
  ])
})
