import {
    STORAGE_KEY_CURRENCY_RATES_BY_USD,
    STORAGE_KEY_TARGET_CURRENCY,
    STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS,
    STORAGE_KEY_LAST_REFRESH_TIME,
    STORAGE_KEY_LAST_CONVERSION_RESULTS,
    STORAGE_DEFAULTS,
    CURRENCY_RATES_REFRESH_INTERVAL,
} from './config.js'
import {
    store,
    retrieve,
    copyToClipboard,
} from './utils.js'
import {
    fetchCurrencyRates,
    prepareCurrencyRates,
    findPossibleCurrencyData,
    getCurrencyCodes,
    convertCurrencies,
} from './utils-currency.js'


const CONTEXTS = ['selection']

const MENU_ITEM_ID_ROOT = 'root'
const MENU_ITEM_ID_OPTIONS_SEPARATOR = 'options_separator'
const MENU_ITEM_ID_OPTIONS = 'options'

const MENU_ITEM_ROOT_DEFAULT_TITLE = '<If you see this, something broke>'



// Ensure storage defaults
Object.keys(STORAGE_DEFAULTS).forEach((key) => {
    if (!retrieve(key)) {
        store(key, STORAGE_DEFAULTS[key])
    }
})



// No need to set up context menu tree at install time (anymore).
chrome.runtime.onInstalled.addListener(() => {

})



// On event pages, listeners must be registered on top,
// not in the `onInstalled` callback.
// (https://developer.chrome.com/extensions/background_pages#listeners)
// eslint-disable-next-line no-unused-vars
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ITEM_ID_OPTIONS) {
        chrome.runtime.openOptionsPage()
    }
    else {
        /** @type {Array<ConversionResult>} */
        const conversionResults = retrieve(STORAGE_KEY_LAST_CONVERSION_RESULTS)

        const clickedConversionResult = conversionResults.find(
            res => res.title === info.menuItemId,
        )

        if (clickedConversionResult) {
            copyToClipboard(clickedConversionResult.conversionResultText)
        }
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
    let conversionResults = []

    const sourceData = findPossibleCurrencyData(sourceText)

    if (sourceData) {
        const currencyRates = retrieve(STORAGE_KEY_CURRENCY_RATES_BY_USD)
        const targetCurrencyCode = retrieve(STORAGE_KEY_TARGET_CURRENCY)
        const preferredSourceCurrencies = retrieve(STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS)

        const sourceCurrencyCodes = getCurrencyCodes(
            [
                sourceData.rightWord,
                sourceData.leftWord,
            ],
            currencyRates,
            preferredSourceCurrencies,
        )

        conversionResults = convertCurrencies(
            sourceData.number,
            sourceCurrencyCodes,
            targetCurrencyCode,
            currencyRates,
        )

        // Can contain `null`s after `convertCurrencies()`,
        // filter them out
        conversionResults.filter(v => v)
    }

    store(STORAGE_KEY_LAST_CONVERSION_RESULTS, conversionResults)

    updateContextMenu(conversionResults)
}



/**
 * @param {Array<ConversionResult>} conversionResults
 */
function updateContextMenu(conversionResults) {
    // (Re-)Create context menu entries
    chrome.contextMenus.removeAll(() => {
        // After removal

        chrome.contextMenus.create({
            id: MENU_ITEM_ID_ROOT,
            title: conversionResults[0]
                ? conversionResults[0].title
                : MENU_ITEM_ROOT_DEFAULT_TITLE,
            contexts: CONTEXTS,
            visible: !!conversionResults[0],
        })

        conversionResults.forEach((conversionResult) => {
            chrome.contextMenus.create({
                parentId: MENU_ITEM_ID_ROOT,
                id: conversionResult.title,
                title: conversionResult.title + ' (Copy...)',
                contexts: CONTEXTS,
            })
        })

        // The last items in sub-menu
        chrome.contextMenus.create({
            parentId: MENU_ITEM_ID_ROOT,
            id: MENU_ITEM_ID_OPTIONS_SEPARATOR,
            type: 'separator',
            contexts: CONTEXTS,
        })
        chrome.contextMenus.create({
            parentId: MENU_ITEM_ID_ROOT,
            id: MENU_ITEM_ID_OPTIONS,
            title: 'Options...',
            contexts: CONTEXTS,
        })
    })
}



async function refreshRates() {
    const nowTime = (new Date()).getTime()
    const lastRefreshTime = retrieve(STORAGE_KEY_LAST_REFRESH_TIME)

    if (
        !lastRefreshTime ||
        nowTime > lastRefreshTime + CURRENCY_RATES_REFRESH_INTERVAL
    ) {
        const currencyRates = prepareCurrencyRates(
            await fetchCurrencyRates(),
        )

        store(STORAGE_KEY_CURRENCY_RATES_BY_USD, currencyRates)
        store(STORAGE_KEY_LAST_REFRESH_TIME, nowTime)
    }
}
