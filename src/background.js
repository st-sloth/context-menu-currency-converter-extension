import {
    STORAGE_KEY_CURRENCY_RATES_BY_USD,
    STORAGE_KEY_SELECTED_CURRENCY,
    STORAGE_KEY_LAST_REFRESH_TIME,
    STORAGE_KEY_LAST_SELECTION,
    STORAGE_KEY_LAST_CONVERTED_TEXT,
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
    formatCurrency,
} from './utils-currency.js'


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

    const sourceData = findPossibleCurrencyData(sourceText)

    if (sourceData) {
        const currencyRates = retrieve(STORAGE_KEY_CURRENCY_RATES_BY_USD)

        const sourceCurrencyCodes = getCurrencyCodes(
            [
                sourceData.rightWord,
                sourceData.leftWord,
            ],
            currencyRates,
        )

        // TODO handle all found currency codes
        const sourceCurrencyCode = sourceCurrencyCodes[0]

        if (sourceCurrencyCodes) {
            const targetCurrencyCode = retrieve(STORAGE_KEY_SELECTED_CURRENCY)

            const intermediateUsdValue = (
                sourceData.number * currencyRates[sourceCurrencyCode].inverseRate
            )

            const targetNumericValue = (
                intermediateUsdValue * currencyRates[targetCurrencyCode].rate
            )

            convertedText = formatCurrency(targetNumericValue, targetCurrencyCode)

            newContextMenuItemTitle = (
                formatCurrency(sourceData.number, sourceCurrencyCode) +
                ' → ' +
                convertedText
            )
        }
    }

    store(STORAGE_KEY_LAST_SELECTION, sourceText)
    store(STORAGE_KEY_LAST_CONVERTED_TEXT, convertedText)

    chrome.contextMenus.update(MENU_ITEM_ID_ROOT, {
        title: newContextMenuItemTitle,
        visible: !!convertedText,
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
