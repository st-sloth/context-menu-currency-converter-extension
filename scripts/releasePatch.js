'use strict'

const path = require('path')

const { releaseVersion } = require('./release')



releaseVersion(path.join(__dirname, '..'), 'patch')
