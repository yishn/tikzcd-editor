let id = 10

export function getId() {
    return (id++).toString()
}

export function clamp(min, max, x) {
    return Math.max(min, Math.min(max, x))
}
