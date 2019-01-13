'use strict'


const CONTEXTS = ['selection']

const MENU_ITEM_ID_ROOT = 'root'
const MENU_ITEM_ID_COPY = 'copy'
const MENU_ITEM_ID_OPTIONS = 'options'

// TODO
const MENU_ITEM_ROOT_DEFAULT_TITLE = '...'

const STORAGE_KEY_LAST_SELECTION = 'last_selection'
const STORAGE_KEY_LAST_CONVERTED_VALUE = 'last_converted_value'



// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: MENU_ITEM_ID_ROOT,
        title: MENU_ITEM_ROOT_DEFAULT_TITLE,
        contexts: CONTEXTS,
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
            window.localStorage.getItem(STORAGE_KEY_LAST_CONVERTED_VALUE),
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



function handleSelectionChange(text) {
    // TODO
    const convertedValue = String.prototype.toUpperCase.apply(text)
    const newTitle = text
        ? `${text} → ${convertedValue}`
        : MENU_ITEM_ROOT_DEFAULT_TITLE

    window.localStorage.setItem(STORAGE_KEY_LAST_SELECTION, text)
    window.localStorage.setItem(STORAGE_KEY_LAST_CONVERTED_VALUE, convertedValue)

    chrome.contextMenus.update(MENU_ITEM_ID_ROOT, {
        title: newTitle,
    })
}



// https://stackoverflow.com/a/18455088/3187607
function copyToClipboard(text) {
    const document = window.document
    const proxyEl = document.createElement('textarea')
    proxyEl.textContent = text
    document.body.appendChild(proxyEl)
    proxyEl.select()
    document.execCommand('Copy', false, null)
    document.body.removeChild(proxyEl)
}
