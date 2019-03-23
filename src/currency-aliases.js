// Browser only allows imports of 'application/javascript`
// so we can't import `currency-format/currency-format.json` directly,
// instead creating local .js file with the data
import currencyData from './_currency-format.js'


/**
 * Keys are aliases (e.g. currency symbols), values are sets of currency codes
 * @type {Object<Set<string>>}
 */
const aliases = {}

/**
 * @param {string} alias
 * @param {string} currencyCode
 */
function addAlias(alias, currencyCode) {
    if (!aliases[alias]) {
        aliases[alias] = new Set()
    }

    aliases[alias].add(currencyCode)
}


// External aliases

// eslint-disable-next-line guard-for-in, no-restricted-syntax
for (const currencyCode in currencyData) {
    if (currencyData[currencyCode].symbol) {
        addAlias(
            currencyData[currencyCode].symbol.grapheme,
            currencyCode,
        )
    }

    if (currencyData[currencyCode].uniqSymbol) {
        addAlias(
            currencyData[currencyCode].uniqSymbol.grapheme,
            currencyCode,
        )
    }
}


// Custom aliases
addAlias('zl', 'PLN')
addAlias('руб', 'RUB')


// TODO handle different letter cases
export default aliases
