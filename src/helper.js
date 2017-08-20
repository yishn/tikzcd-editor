let id = 0

export function getId() {
    return (id++).toString()
}

export function clamp(min, max, x) {
    return Math.max(min, Math.min(max, x))
}

export function arrEquals(a, b) {
    return a.length === b.length && a.every((x, i) => x === b[i])
}

export function arrAdd(a, b) {
    return a.map((x, i) => x + b[i])
}

export function arrScale(m, a) {
    return a.map(x => m * x)
}

export function arrSubtract(a, b) {
    return a.map((x, i) => x - b[i])
}
