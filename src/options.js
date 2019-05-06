import {
    STORAGE_KEY_CURRENCY_RATES_BY_USD,
    STORAGE_KEY_TARGET_CURRENCY,
    STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS,
    STORAGE_KEY_LAST_REFRESH_TIME,
} from './config.js'

import CURRENCY_ALIASES from './currency-aliases.js'

import { retrieve, store } from './utils.js'
import { getCurrencyCodes } from './utils-currency.js'


// eslint-disable-next-line prefer-destructuring
const document = window.document


document.addEventListener('DOMContentLoaded', () => {
    const currencyRates = retrieve(STORAGE_KEY_CURRENCY_RATES_BY_USD)
    const targetCurrencyCode = retrieve(STORAGE_KEY_TARGET_CURRENCY)
    const preferredCurrencies = retrieve(STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS)
    const lastRefreshTime = retrieve(STORAGE_KEY_LAST_REFRESH_TIME)


    if (lastRefreshTime) {
        document.getElementById('lastRefreshValue')
            .innerText = (new Date(lastRefreshTime)).toLocaleString()
    }


    if (currencyRates) {
        const targetCurrencySelectEl = document.getElementById('targetCurrencySelect')

        const ratesArray = Object.keys(currencyRates)
            .map(key => currencyRates[key])

        const options = ratesArray.map((currency) => {
            const currencyCode = currency.code

            return (
                `<option 
                    value="${currencyCode}"
                    ${currencyCode === targetCurrencyCode ? 'selected' : ''}
                >
                    ${currency.name} (${currencyCode})
                </option>`
            )
        })

        targetCurrencySelectEl.innerHTML = options.join('\n')

        targetCurrencySelectEl.addEventListener('input', () => {
            store(STORAGE_KEY_TARGET_CURRENCY, targetCurrencySelectEl.value)
        })



        const aliasesListEl = document.getElementById('sourceCurrencyAliasesList')

        /** @type {Array<{title: string, currencyCodes: Array<string>}>} */
        const nonUniqueAliases = Object.keys(CURRENCY_ALIASES)
            .map(aliasTitle => ({
                title: aliasTitle,
                // From `getCurrencyCodes`, and not directly from `CURRENCY_ALIASES`,
                // so that irrelevant codes, that are not present in the rates,
                // are filtered out.
                currencyCodes: getCurrencyCodes([aliasTitle], currencyRates),
            }))
            // Only leave aliases that map to more than 1 currency
            .filter(aliasObj => aliasObj.currencyCodes.length > 1)

        aliasesListEl.innerHTML = nonUniqueAliases
            .map(aliasObj => `
                <div class="currency-alias-row">
                    <span class="currency-alias-row__title">
                        ${aliasObj.title}
                    </span>
                    <select 
                        class="currency-alias-row__select"
                        data-alias="${aliasObj.title}"
                    >
                        ${aliasObj.currencyCodes.map(currencyCode => `
                            <option 
                                value="${currencyCode}"
                                ${currencyCode === preferredCurrencies[aliasObj.title] ? 'selected' : ''}
                            >
                                ${currencyRates[currencyCode].name} (${currencyCode})
                            </option>
                        `)}
                    </select>
                </div>
            `)
            .join('\n')

        aliasesListEl.querySelectorAll('.currency-alias-row__select')
            .forEach((aliasSelectEl) => {
                aliasSelectEl.addEventListener('input', () => {
                    const { alias } = aliasSelectEl.dataset

                    store(STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS, {
                        // Need to always update the value
                        // actual at the time of the callback,
                        // and not some old value in the closure
                        ...retrieve(STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS),
                        [alias]: aliasSelectEl.value,
                    })
                })
            })
    }
})
