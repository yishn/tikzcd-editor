export function getRectCenteredAround([x, y], width, height) {
    return {
        width,
        height,
        left: x - width / 2,
        top: y - height / 2
    }
}

export function insideRect(rect, p) {
    let {left, top, width, height} = rect
    let [p1, p2] = p

    return left <= p1 && p1 <= left + width && top <= p2 && p2 <= top + height
}

export function getRectSegmentIntersections(rect, p1, p2) {
    let {left, top, width, height} = rect
    let [x1, y1] = p1
    let [x2, y2] = p2

    let d = [x2 - x1, y2 - y1]
    let leftTop = [left, top]

    let ts = [x1, y1]
        .map((x, i) => [leftTop[i], leftTop[i] + [width, height][i]].map(y => (y - x) / d[i]))
        .reduce((acc, x) => [...acc, ...x], [])

    return ts.filter(t => 0 <= t && t <= 1)
        .map(t => p1.map((x, i) => x + t * d[i]))
        .filter(p => insideRect(rect, p))
}

export function getPerpendicularLeftVector([x, y]) {
    return [-y, x]
}

export function norm(p) {
    return Math.sqrt(p.reduce((acc, x) => acc + x * x, 0))
}

export function normalize(p) {
    let n = norm(p)
    return p.map(x => x / n)
}
