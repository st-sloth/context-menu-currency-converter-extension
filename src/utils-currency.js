import { CURRENCY_RATES_SOURCE } from './config.js'
import CURRENCY_ALIASES from './currency-aliases.js'
import { escapeRegExp } from './utils.js'


/**
 * In the format of CURRENCY_RATES_SOURCE
 *
 * @typedef {Object} CurrencyRate
 * @property {string} code ('EUR')
 * @property {string} alphaCode ('EUR')
 * @property {string} numericCode ('978')
 * @property {string} name ('Euro')
 * @property {number} rate (0.87719146284662)
 * @property {string} date ('Thu, 21 Mar 2019 12:00:02 GMT')
 * @property {number} inverseRate (1.140001974888)
 */

/**
 * @typedef {Object<CurrencyRate>} CurrencyRates
 */

/**
 * @typedef {Object} ConversionResult
 * @property {string} title
 * @property {string} conversionResultText
 */



/**
 * @return {Promise<CurrencyRates>}
 */
export async function fetchCurrencyRates() {
    const response = await window.fetch(CURRENCY_RATES_SOURCE)
    const data = await response.json()

    return data
}



/**
 * Change object keys (which are currency codes) to upper case,
 * and ensure USD presence.
 *
 * @param {CurrencyRates} currencyRates
 * @return {CurrencyRates}
 */
export function prepareCurrencyRates(currencyRates) {
    const preparedCurrencyRates = {}

    // The API for the rates is relative to USD and doesn't include USD itself.
    // Doing it before the conversions so USD is the first in the key iteration.
    if (!('usd' in currencyRates)) {
        preparedCurrencyRates.USD = {
            code: 'USD',
            alphaCode: 'USD',
            numericCode: '840',
            name: 'U.S. Dollar',
            rate: 1,
            inverseRate: 1,
        }
    }

    Object.keys(currencyRates).forEach((currencyCodeLowerCase) => {
        preparedCurrencyRates[currencyCodeLowerCase.toUpperCase()] =
            currencyRates[currencyCodeLowerCase]
    })

    return preparedCurrencyRates
}



/**
 * Get currency codes in upper case, like 'EUR', 'USD', etc.
 * for every input word.
 * If none of the input words can be cast to a currency code,
 * empty array is returned.
 *
 * @param {Array<string>} words
 * @param {CurrencyRates} currencyRates
 * @param {Object<string> =} preferredSourceCurrencies
 * @return {Array<string>}
 */
export function getCurrencyCodes(words, currencyRates, preferredSourceCurrencies = {}) {
    const codes = []

    // eslint-disable-next-line no-restricted-syntax
    for (const word of words) {
        const potentialCodes = []

        if (word in preferredSourceCurrencies) {
            potentialCodes.push(preferredSourceCurrencies[word])
        }

        if (word in CURRENCY_ALIASES) {
            potentialCodes.push(...(
                CURRENCY_ALIASES[word]
                    // Exclude already pushed preferred currency,
                    // regardless of its existence (comparing with `undefined`)
                    .filter(code => code !== preferredSourceCurrencies[word])
            ))
        }

        if (potentialCodes.length === 0) {
            potentialCodes.push(word)
        }

        potentialCodes
            // Handle only valid currencies
            .filter(code => (
                code &&
                currencyRates &&
                code in currencyRates
            ))
            .forEach(code => codes.push(code))
    }

    return codes
}



/**
 * @param {string} sourceText
 * @return {null | {number: number, leftWord: string, rightWord: string}}
 */
export function findPossibleCurrencyData(sourceText) {
    if (sourceText) {
        // Find number with different thousand and decimal separators.
        // `(?!\d)` is needed to make regexp process all digits until a non-digit;
        // otherwise, in "87654321", only "876543" would match.
        // Also, allowing space as decimal separator to handle Amazon-like prices,
        // where fractional part is in another element
        // positioned as a superscript or a subscript.
        const sourceNumericMatch = sourceText.match(
            /(?<integral>-?\d{1,3}((?<thouSep>[ ,.])?\d{3})?(\k<thouSep>\d{3})*(?!\d))([ ,.](?<fractional>\d*))?/,
        )

        if (sourceNumericMatch) {
            const integralPart = sourceNumericMatch.groups.integral
                .replace(/[^-0-9]/g, '')
            const fractionalPart = sourceNumericMatch.groups.fractional || ''

            const sourceNumericText = sourceNumericMatch[0]
            const sourceNumericValue = parseFloat(integralPart + '.' + fractionalPart)

            // Find currency
            const sourceNumericTextEscaped = escapeRegExp(sourceNumericText)
            const applicableWordChars = '[^\\s0-9.,;:!?=+\\-*/\\\\<>(){}[\\]\'"`~@%\\^&]'
            const currencyFinderRe = new RegExp(
                `((?<leftWord>${applicableWordChars}+)\\s*)?${sourceNumericTextEscaped}(\\s*(?<rightWord>${applicableWordChars}+))?`,
            )
            const sourceCurrencyMatch = sourceText.match(currencyFinderRe)

            return {
                number: sourceNumericValue,
                leftWord: sourceCurrencyMatch.groups.leftWord,
                rightWord: sourceCurrencyMatch.groups.rightWord,
            }
        }
    }

    return null
}



/**
 * @param {number} value
 * @param {string} currency
 * @return {string}
 */
export function formatCurrency(value, currency) {
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
 * @param {number} sourceValue
 * @param {Array<string>} sourceCurrencyCodes
 * @param {string} targetCurrencyCode
 * @param {CurrencyRates} currencyRates
 * @return {Array<ConversionResult | null>}
 */
export function convertCurrencies(
    sourceValue,
    sourceCurrencyCodes,
    targetCurrencyCode,
    currencyRates,
) {
    const targetCurrencyRate = currencyRates[targetCurrencyCode]

    const result = sourceCurrencyCodes.map((sourceCode) => {
        const sourceCurrencyRate = currencyRates[sourceCode]

        // If rates are unavailable for either currency
        if (!sourceCurrencyRate || !targetCurrencyRate) {
            return null
        }

        const intermediateUsdValue = (
            sourceValue * sourceCurrencyRate.inverseRate
        )

        const targetValue = (
            intermediateUsdValue * targetCurrencyRate.rate
        )

        const targetText = formatCurrency(targetValue, targetCurrencyCode)
        const title = (
            formatCurrency(sourceValue, sourceCode) +
            ' → ' +
            targetText
        )

        return {
            title,
            conversionResultText: targetText,
        }
    })

    return result
}
