'use strict'

const fs = require('fs')
const path = require('path')

// eslint-disable-next-line import/no-extraneous-dependencies
const Archiver = require('archiver')

const packageJson = require('../package.json')



// eslint-disable-next-line prefer-destructuring
const version = packageJson.version

const output = fs.createWriteStream(path.join(__dirname, '..', 'dist', version + '.zip'))

const archive = new Archiver('zip', {
    zlib: { level: 9 },
})

archive.on('warning', (error) => {
    throw error
})
archive.on('error', (error) => {
    throw error
})
archive.pipe(output)

archive.file('manifest.json')
archive.glob('icons/**')
archive.glob('src/**')

archive.finalize()
