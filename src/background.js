// eslint-disable-next-line import/extensions
import CURRENCY_ALIASES from './currency-aliases.js'


const CONTEXTS = ['selection']

const MENU_ITEM_ID_ROOT = 'root'
const MENU_ITEM_ID_COPY = 'copy'
const MENU_ITEM_ID_OPTIONS = 'options'

// TODO Better default? (even tho menu item is hidden when this title is used)
const MENU_ITEM_ROOT_DEFAULT_TITLE = '...'

const STORAGE_KEY_LAST_SELECTION = 'last_selection'
const STORAGE_KEY_LAST_CONVERTED_TEXT = 'last_converted_text'



// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: MENU_ITEM_ID_ROOT,
        title: MENU_ITEM_ROOT_DEFAULT_TITLE,
        contexts: CONTEXTS,
        visible: false,
    })
    chrome.contextMenus.create({
        parentId: MENU_ITEM_ID_ROOT,
        id: MENU_ITEM_ID_COPY,
        title: 'Copy',
        contexts: CONTEXTS,
    })
    chrome.contextMenus.create({
        parentId: MENU_ITEM_ID_ROOT,
        id: MENU_ITEM_ID_OPTIONS,
        title: 'Options...',
        contexts: CONTEXTS,
    })
})



// On event pages, listeners must be registered on top,
// not in the `onInstalled` callback.
// (https://developer.chrome.com/extensions/background_pages#listeners)
// eslint-disable-next-line no-unused-vars
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ITEM_ID_OPTIONS) {
        chrome.runtime.openOptionsPage()
    }
    else if (info.menuItemId === MENU_ITEM_ID_COPY) {
        copyToClipboard(
            window.localStorage.getItem(STORAGE_KEY_LAST_CONVERTED_TEXT),
        )
    }
})



// Content script listener.
// eslint-disable-next-line no-unused-vars
chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type === 'selectionchange') {
        handleSelectionChange(message.value)
    }
})



/**
 * @param {string} sourceText
 */
function handleSelectionChange(sourceText) {
    let convertedText = ''
    let newContextMenuItemTitle = MENU_ITEM_ROOT_DEFAULT_TITLE

    if (sourceText) {
        // Find number with different thousand and decimal separators.
        // `(?!\d)` is needed to make regexp process all digits until a non-digit;
        // otherwise, in "87654321", only "876543" would match.
        // Also, allowing space as decimal separator to handle Amazon-like prices,
        // where fractional part is in another element
        // positioned as a superscript or a subscript.
        const sourceNumericMatch = sourceText.match(
            /(?<integral>\d{1,3}([ ,.]?\d{3})*(?!\d))([ ,.](?<fractional>\d{0,2}))?/,
        )

        if (sourceNumericMatch) {
            const integralPart = sourceNumericMatch.groups.integral
                .replace(/\D/g, '')
            const fractionalPart = sourceNumericMatch.groups.fractional || ''

            const sourceNumericText = sourceNumericMatch[0]
            const sourceNumericValue = parseFloat(integralPart + '.' + fractionalPart)

            // Find currency
            const sourceNumericTextEscaped = sourceNumericText.replace(/[.]/g, '\\$&')
            const currencyFinderRe = new RegExp(
                `((?<leftWord>\\S+)\\s*)?${sourceNumericTextEscaped}(\\s*(?<rightWord>\\S+))?`,
            )
            const sourceCurrencyMatch = sourceText.match(currencyFinderRe)

            const sourceCurrencyCode = getCurrencyCode(
                sourceCurrencyMatch.groups.rightWord ||
                sourceCurrencyMatch.groups.leftWord,
            )

            if (sourceCurrencyCode) {
                // TODO Convert value to selected currency
                convertedText = 'TODO'

                newContextMenuItemTitle = (
                    formatCurrency(sourceNumericValue, sourceCurrencyCode) +
                    ' → ' +
                    convertedText
                )
            }
        }
    }

    window.localStorage.setItem(STORAGE_KEY_LAST_SELECTION, sourceText)
    window.localStorage.setItem(STORAGE_KEY_LAST_CONVERTED_TEXT, convertedText)

    chrome.contextMenus.update(MENU_ITEM_ID_ROOT, {
        title: newContextMenuItemTitle,
        visible: !!convertedText,
    })
}



/**
 * https://stackoverflow.com/a/18455088/3187607
 * @param {string} text
 */
function copyToClipboard(text) {
    const document = window.document
    const proxyEl = document.createElement('textarea')
    proxyEl.textContent = text
    document.body.appendChild(proxyEl)
    proxyEl.select()
    document.execCommand('Copy', false, null)
    document.body.removeChild(proxyEl)
}



/**
 * @param {number} value
 * @param {string} currency
 * @return {string}
 */
function formatCurrency(value, currency) {
    let valueString = value.toFixed(2)

    // Add thousand space separators after each digit
    // followed by one or more groups of three digits
    // until the decimal point.
    // With a function replacer for debugging with breakpoints.
    // eslint-disable-next-line arrow-body-style
    valueString = valueString.replace(/\d(?=((\d{3})+)\.)/g, (substr) => {
        return substr + ' '
    })

    return valueString + ' ' + currency
}



/**
 * Get currency code in upper case, like 'EUR', 'USD', etc.
 * If the input text cannot be cast to a currency code, `null` is returned.
 *
 * @param {string} text
 * @return {string | null}
 */
function getCurrencyCode(text) {
    /** @type {string | null} */
    let code = null

    if (text in CURRENCY_ALIASES) {
        code = CURRENCY_ALIASES[text]
    }
    // TODO Handle only valid currencies from a list
    // eslint-disable-next-line no-constant-condition
    else if (true) {
        code = text
    }

    if (code) {
        code = code.toUpperCase()
    }

    return code
}
