'use strict'

const fs = require('fs')
const path = require('path')

const currencyFormat = require('currency-format/currency-format.json')


fs.writeFileSync(
    path.join(__dirname, '..', 'src', '_currency-format.js'),
    'export default ' + JSON.stringify(currencyFormat, null, 4),
)
