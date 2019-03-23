import test from 'ava'

import CURRENCY_ALIASES from '../src/currency-aliases'
import mockCurrencyRates from './mockCurrencyRates'

import {
    prepareCurrencyRates,
    getCurrencyCodes,
    findPossibleCurrencyData,
    formatCurrency,
    convertCurrencies,
} from '../src/utils-currency'

const CURRENCY_CODE_REGEX = /[A-Z]{3}/

const preparedCurrencyRates = prepareCurrencyRates(mockCurrencyRates)



test('Currency aliases', (t) => {
    const aliases = Object.keys(CURRENCY_ALIASES)

    t.true(aliases.length > 0)

    aliases.forEach((alias) => {
        t.true(CURRENCY_ALIASES[alias] instanceof Set)

        CURRENCY_ALIASES[alias].forEach(
            code => t.regex(code, CURRENCY_CODE_REGEX),
        )
    })
})



test('Currency rates', (t) => {
    const rates = Object.keys(preparedCurrencyRates)

    t.true(rates.length > 0)

    rates.forEach((code) => {
        t.regex(code, CURRENCY_CODE_REGEX)
        t.true('code' in preparedCurrencyRates[code])
        t.true('alphaCode' in preparedCurrencyRates[code])
        t.true('numericCode' in preparedCurrencyRates[code])
        t.true('name' in preparedCurrencyRates[code])
        t.true('rate' in preparedCurrencyRates[code])
        t.true('inverseRate' in preparedCurrencyRates[code])
    })
})



test('Currency codes by aliases', (t) => {
    t.deepEqual(
        getCurrencyCodes([], preparedCurrencyRates),
        [],
    )
    t.deepEqual(
        getCurrencyCodes(['qwerty', 'poiuyt'], preparedCurrencyRates),
        [],
    )
    t.deepEqual(
        getCurrencyCodes(['qwerty', 'poiuyt', 'USD'], preparedCurrencyRates),
        ['USD'],
    )
    t.deepEqual(
        getCurrencyCodes(['€', 'qwerty', 'EUR'], preparedCurrencyRates),
        ['EUR', 'EUR'],
    )
    t.deepEqual(
        getCurrencyCodes(['NZ$'], preparedCurrencyRates),
        ['NZD'],
    )
    t.deepEqual(
        getCurrencyCodes(['₨'], preparedCurrencyRates),
        ['LKR', 'MUR', 'NPR', 'PKR', 'SCR'],
    )

    // Custom aliases
    t.deepEqual(
        getCurrencyCodes(['zl', 'руб'], preparedCurrencyRates),
        ['PLN', 'RUB'],
    )
})



test('findPossibleCurrencyData()', (t) => {
    t.deepEqual(
        findPossibleCurrencyData('asdf'),
        null,
    )
    t.deepEqual(
        findPossibleCurrencyData('1234'),
        {
            number: 1234,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1234.56 ABC'),
        {
            number: 1234.56,
            leftWord: undefined,
            rightWord: 'ABC',
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('$1 234.56'),
        {
            number: 1234.56,
            leftWord: '$',
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('USD 1,234.56 EUR'),
        {
            number: 1234.56,
            leftWord: 'USD',
            rightWord: 'EUR',
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('qwe, 1,234 56, asd'),
        {
            number: 1234.56,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('qwe 1.234 56 asd'),
        {
            number: 1234.56,
            leftWord: 'qwe',
            rightWord: 'asd',
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234,56'),
        {
            number: 1234.56,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234.56'),
        {
            number: 1234.56,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('$-1 234.56 %'),
        {
            number: -1234.56,
            leftWord: '$',
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234 567.1'),
        {
            number: 1234567.1,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234 567.12'),
        {
            number: 1234567.12,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234 567.123'),
        {
            number: 1234567.123,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234 567.1234'),
        {
            number: 1234567.1234,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    t.deepEqual(
        findPossibleCurrencyData('1 234 567.123456'),
        {
            number: 1234567.123456,
            leftWord: undefined,
            rightWord: undefined,
        },
    )
    // TODO handle fractions with thousand separators?
})



test('formatCurrency()', (t) => {
    t.is(
        formatCurrency(1, 'AAA'),
        '1.00 AAA',
    )
    t.is(
        formatCurrency(3.14159, 'AAA'),
        '3.14 AAA',
    )
    t.is(
        formatCurrency(12345678.87654321, 'AAA'),
        '12 345 678.88 AAA',
    )
    t.is(
        formatCurrency(-12345678.87654321, 'AAA'),
        '-12 345 678.88 AAA',
    )
})



test('convertCurrencies()', (t) => {
    t.deepEqual(
        convertCurrencies(
            10,
            [],
            'EUR',
            preparedCurrencyRates,
        ),
        [],
    )
    t.deepEqual(
        convertCurrencies(
            10,
            ['AAA'],
            'EUR',
            preparedCurrencyRates,
        ),
        [
            null,
        ],
    )
    t.deepEqual(
        convertCurrencies(
            10,
            ['EUR'],
            'AAA',
            preparedCurrencyRates,
        ),
        [
            null,
        ],
    )
    t.deepEqual(
        convertCurrencies(
            10,
            ['EUR', 'AAA', 'USD'],
            'EUR',
            preparedCurrencyRates,
        ),
        [
            { title: '10.00 EUR → 10.00 EUR', conversionResultText: '10.00 EUR' },
            null,
            { title: '10.00 USD → 8.77 EUR', conversionResultText: '8.77 EUR' },
        ],
    )
    t.deepEqual(
        convertCurrencies(
            10,
            ['DKK', 'ISK', 'NOK', 'SEK'],
            'EUR',
            preparedCurrencyRates,
        ),
        [
            { title: '10.00 DKK → 1.34 EUR', conversionResultText: '1.34 EUR' },
            { title: '10.00 ISK → 0.08 EUR', conversionResultText: '0.08 EUR' },
            { title: '10.00 NOK → 1.03 EUR', conversionResultText: '1.03 EUR' },
            { title: '10.00 SEK → 0.96 EUR', conversionResultText: '0.96 EUR' },
        ],
    )
})
