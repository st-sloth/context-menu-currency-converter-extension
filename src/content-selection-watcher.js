'use strict';

(() => {
    function debounce(func, wait) {
        let timeoutId

        return function debounced(...args) {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                timeoutId = null
                func(...args)
            }, wait)
        }
    }


    window.document.addEventListener('selectionchange', debounce(() => {
        chrome.runtime.sendMessage({
            type: 'selectionchange',
            value: window.getSelection().toString(),
        })
    }, 200))
})()
