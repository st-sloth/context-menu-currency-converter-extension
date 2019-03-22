/**
 * @param {string} key
 * @param {*} value
 */
export function store(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value))
}

/**
 * @param {string} key
 * @return {*}
 */
export function retrieve(key) {
    const storageValue = window.localStorage.getItem(key)

    return JSON.parse(storageValue)
}



/**
 * https://stackoverflow.com/a/18455088/3187607
 * @param {string} text
 */
export function copyToClipboard(text) {
    // eslint-disable-next-line prefer-destructuring
    const document = window.document
    const proxyEl = document.createElement('textarea')
    proxyEl.textContent = text
    document.body.appendChild(proxyEl)
    proxyEl.select()
    document.execCommand('Copy', false, null)
    document.body.removeChild(proxyEl)
}



/**
 * Taken from
 * https://stackoverflow.com/a/6969486/3187607
 * or maybe
 * https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
 * is the source
 *
 * @param {string} string
 * @return {string}
 */
export function escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
