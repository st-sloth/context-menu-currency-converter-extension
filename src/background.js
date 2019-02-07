import {
    store,
    retrieve,
    copyToClipboard,
    escapeRegExp,
} from './utils.js'
import CURRENCY_ALIASES from './currency-aliases.js'
import {
    STORAGE_KEY_CURRENCY_RATES_BY_USD,
    STORAGE_KEY_SELECTED_CURRENCY,
    STORAGE_KEY_LAST_REFRESH_TIME,
    STORAGE_KEY_LAST_SELECTION,
    STORAGE_KEY_LAST_CONVERTED_TEXT,
    STORAGE_DEFAULTS,
    CURRENCY_RATES_SOURCE,
    CURRENCY_RATES_REFRESH_INTERVAL,
} from './config.js'


const CONTEXTS = ['selection']

const MENU_ITEM_ID_ROOT = 'root'
const MENU_ITEM_ID_COPY = 'copy'
const MENU_ITEM_ID_OPTIONS = 'options'

const MENU_ITEM_ROOT_DEFAULT_TITLE = '<If you see this, something broke>'



// Ensure storage defaults
Object.keys(STORAGE_DEFAULTS).forEach((key) => {
    if (!retrieve(key)) {
        store(key, STORAGE_DEFAULTS[key])
    }
})



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
            retrieve(STORAGE_KEY_LAST_CONVERTED_TEXT),
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



// Check and refresh stored rates at event page waking
refreshRates()



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
            const sourceNumericTextEscaped = escapeRegExp(sourceNumericText)
            const currencyFinderRe = new RegExp(
                `((?<leftWord>\\S+)\\s*)?${sourceNumericTextEscaped}(\\s*(?<rightWord>\\S+))?`,
            )
            const sourceCurrencyMatch = sourceText.match(currencyFinderRe)

            const currencyRates = retrieve(STORAGE_KEY_CURRENCY_RATES_BY_USD)

            const sourceCurrencyCode = getFirstCurrencyCode(
                [
                    sourceCurrencyMatch.groups.rightWord,
                    sourceCurrencyMatch.groups.leftWord,
                ],
                currencyRates,
            )

            if (sourceCurrencyCode) {
                const targetCurrencyCode = retrieve(STORAGE_KEY_SELECTED_CURRENCY)

                // TODO Adapt structure to be less API type dependent
                const intermediateUsdValue = (
                    sourceNumericValue * currencyRates[sourceCurrencyCode.toLowerCase()].inverseRate
                )

                const targetNumericValue = (
                    intermediateUsdValue * currencyRates[targetCurrencyCode.toLowerCase()].rate
                )

                convertedText = formatCurrency(targetNumericValue, targetCurrencyCode)

                newContextMenuItemTitle = (
                    formatCurrency(sourceNumericValue, sourceCurrencyCode) +
                    ' → ' +
                    convertedText
                )
            }
        }
    }

    store(STORAGE_KEY_LAST_SELECTION, sourceText)
    store(STORAGE_KEY_LAST_CONVERTED_TEXT, convertedText)

    chrome.contextMenus.update(MENU_ITEM_ID_ROOT, {
        title: newContextMenuItemTitle,
        visible: !!convertedText,
    })
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
 * Get first currency code in upper case, like 'EUR', 'USD', etc.
 * If none of the input texts can be cast to a currency code,
 * empty string is returned.
 *
 * @param {Array<string>} texts
 * @param {Object} currencyRates
 * @return {string}
 */
function getFirstCurrencyCode(texts, currencyRates) {
    // eslint-disable-next-line no-restricted-syntax
    for (const text of texts) {
        const code = text in CURRENCY_ALIASES
            ? CURRENCY_ALIASES[text]
            : text

        // Handle only valid currencies
        // TODO Adapt structure to be less API type dependent
        if (
            code &&
            currencyRates &&
            (code.toLowerCase() in currencyRates)
        ) {
            return code.toUpperCase()
        }
    }

    return ''
}



async function refreshRates() {
    const nowTime = (new Date()).getTime()
    const lastRefreshTime = retrieve(STORAGE_KEY_LAST_REFRESH_TIME)

    if (
        !lastRefreshTime ||
        nowTime > lastRefreshTime + CURRENCY_RATES_REFRESH_INTERVAL
    ) {
        const response = await window.fetch(CURRENCY_RATES_SOURCE)
        let data = await response.json()

        // TODO Get rid of this hack for full currency list
        //      (the API for rates relative to USD doesn't include USD itself).
        //      New object with spreading so USD is first in the key iteration.
        if (!('usd' in data)) {
            data = {
                usd: {
                    code: 'USD',
                    alphaCode: 'USD',
                    numericCode: '840',
                    name: 'U.S. Dollar',
                    rate: 1,
                    inverseRate: 1,
                },
                ...data,
            }
        }

        store(STORAGE_KEY_CURRENCY_RATES_BY_USD, data)
        store(STORAGE_KEY_LAST_REFRESH_TIME, nowTime)
    }
}
