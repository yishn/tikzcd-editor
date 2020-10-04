import t from 'tap'
import * as geometry from '../src/geometry.js'

function floatEqual(x, y) {
  return Math.abs(x - y) < Number.EPSILON
}

t.test('getRectCenteredAround', async t => {
  t.strictDeepEqual(geometry.getRectCenteredAround([32, 35], 64, 70), {
    left: 0,
    top: 0,
    width: 64,
    height: 70
  })
})

t.test('insideRect', async t => {
  let rect = {left: 0, top: 0, width: 32, height: 64}

  t.ok(geometry.insideRect(rect, [16, 16]))
  t.ok(geometry.insideRect(rect, [0, 0]))
  t.ok(geometry.insideRect(rect, [0, 32]))
  t.notOk(geometry.insideRect(rect, [-0.5, 16]))
  t.notOk(geometry.insideRect(rect, [33, 16]))
  t.notOk(geometry.insideRect(rect, [33, -1]))
  t.notOk(geometry.insideRect(rect, [0, 64.5]))
  t.notOk(geometry.insideRect(rect, [16, 65]))
})

t.test('norm', async t => {
  t.strictDeepEqual(geometry.norm([0, 1]), 1)
  t.strictDeepEqual(geometry.norm([3, 4]), 5)
  t.ok(floatEqual(geometry.norm([1, 1]), Math.SQRT2))
})

t.test('normalize', async t => {
  t.ok(floatEqual(geometry.norm(geometry.normalize([1, 1])), 1))
  t.ok(floatEqual(geometry.norm(geometry.normalize([67.2, 23.65])), 1))
})

t.test('rotate90DegreesAntiClockwise', async t => {
  t.strictDeepEqual(geometry.rotate90DegreesAntiClockwise([342, 123]), [
    -123,
    342
  ])
  t.strictDeepEqual(geometry.rotate90DegreesAntiClockwise([0.3, 0.2]), [
    -0.2,
    0.3
  ])
})

t.test('getRectSegmentIntersections', async t => {
  let rect = {left: 0, top: 0, width: 32, height: 32}

  t.strictDeepEqual(
    geometry.getRectSegmentIntersections(rect, [-12, 16], [12, 16]),
    [[0, 16]]
  )
  t.strictDeepEqual(
    geometry.getRectSegmentIntersections(rect, [16, -12], [16, 53]),
    [
      [16, 0],
      [16, 32]
    ]
  )
  t.strictDeepEqual(
    geometry.getRectSegmentIntersections(rect, [-12, 16], [-1, 16]),
    []
  )
})
