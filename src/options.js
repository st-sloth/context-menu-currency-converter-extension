import { store, retrieve } from './utils.js'

import {
    STORAGE_KEY_CURRENCY_RATES_BY_USD,
    STORAGE_KEY_SELECTED_CURRENCY,
    STORAGE_KEY_LAST_REFRESH_TIME,
} from './config.js'


window.document.addEventListener('DOMContentLoaded', () => {
    const document = window.document

    const currencyRates = retrieve(STORAGE_KEY_CURRENCY_RATES_BY_USD)
    const selectedCurrencyCode = retrieve(STORAGE_KEY_SELECTED_CURRENCY)
    const lastRefreshTime = retrieve(STORAGE_KEY_LAST_REFRESH_TIME)

    if (lastRefreshTime) {
        document.getElementById('lastRefreshValue')
            .innerText = (new Date(lastRefreshTime)).toLocaleString()
    }

    if (currencyRates) {
        const selectEl = document.getElementById('selectedCurrencyValue')

        const ratesArray = Object.keys(currencyRates)
            .map(key => currencyRates[key])

        const options = ratesArray.map((currency) => {
            const currencyCode = currency.code

            return (
                `<option 
                    value="${currencyCode}"
                    ${currencyCode === selectedCurrencyCode ? 'selected' : ''}
                >
                    ${currency.name} (${currencyCode})
                </option>`
            )
        })

        selectEl.innerHTML = options.join('\n')

        selectEl.addEventListener('input', () => {
            store(STORAGE_KEY_SELECTED_CURRENCY, selectEl.value)
        })
    }
})
