export const STORAGE_KEY_CURRENCY_RATES_BY_USD = 'currency_rates_by_usd'
export const STORAGE_KEY_TARGET_CURRENCY = 'target_currency'
export const STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS = 'preferred_currencies_by_alias'
export const STORAGE_KEY_LAST_REFRESH_TIME = 'last_refresh_time'
export const STORAGE_KEY_LAST_CONVERSION_RESULTS = 'last_conversion_results'

export const STORAGE_DEFAULTS = {
    [STORAGE_KEY_TARGET_CURRENCY]: 'EUR',
    [STORAGE_KEY_PREFERRED_SOURCE_CURRENCIES_BY_ALIAS]: {
        // As these currencies are more internationally used,
        // default non-unique aliases / symbols to them
        $: 'USD',
        '£': 'GBP',
    },
    [STORAGE_KEY_LAST_CONVERSION_RESULTS]: [],
}

export const CURRENCY_RATES_SOURCE = 'https://floatrates.com/daily/usd.json'
export const CURRENCY_RATES_REFRESH_INTERVAL = 1000 * 60 * 60 * 6 // 6 hours
