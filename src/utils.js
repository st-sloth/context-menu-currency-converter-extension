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
    const document = window.document
    const proxyEl = document.createElement('textarea')
    proxyEl.textContent = text
    document.body.appendChild(proxyEl)
    proxyEl.select()
    document.execCommand('Copy', false, null)
    document.body.removeChild(proxyEl)
}
