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

// to support unicode

export function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
    }))
}

export function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}
