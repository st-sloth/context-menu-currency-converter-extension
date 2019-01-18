export const STORAGE_KEY_CURRENCY_RATES_BY_USD = 'currency_rates_by_usd'
export const STORAGE_KEY_SELECTED_CURRENCY = 'selected_currency'
export const STORAGE_KEY_LAST_REFRESH_TIME = 'last_refresh_time'
export const STORAGE_KEY_LAST_SELECTION = 'last_selection'
export const STORAGE_KEY_LAST_CONVERTED_TEXT = 'last_converted_text'

export const STORAGE_DEFAULTS = {
    [STORAGE_KEY_SELECTED_CURRENCY]: 'EUR',
}

export const CURRENCY_RATES_SOURCE = 'https://floatrates.com/daily/usd.json'
export const CURRENCY_RATES_REFRESH_INTERVAL = 1000 * 60 * 60 * 6 // 6 hours