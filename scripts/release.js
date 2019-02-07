'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
// eslint-disable-next-line import/no-extraneous-dependencies
const semver = require('semver')



const execSync = cmd => childProcess.execSync(
    cmd,
    { encoding: 'utf-8' },
)



/**
 * @returns {boolean}
 */
function checkIfUncommittedChanges() {
    try {
        execSync('git diff-index --quiet @')
    }
    catch (error) {
        return true
    }

    return false
}



exports.releaseVersion = function releaseVersion(projectRoot, type) {
    /* eslint-disable import/no-dynamic-require, global-require */
    const packageJsonPath = path.resolve(projectRoot, 'package.json')
    const packageLockJsonPath = path.resolve(projectRoot, 'package-lock.json')
    const manifestJsonPath = path.resolve(projectRoot, 'manifest.json')

    const packageJson = require(packageJsonPath)
    const packageLockJson = require(packageLockJsonPath)
    const manifestJson = require(manifestJsonPath)

    const oldVersion = semver(packageJson.version)
    const newVersion = semver.inc(oldVersion, type)

    if (checkIfUncommittedChanges()) {
        throw new Error('There are uncommitted changes\n')
    }

    packageJson.version = newVersion
    packageLockJson.version = newVersion
    manifestJson.version = newVersion

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    fs.writeFileSync(packageLockJsonPath, JSON.stringify(packageLockJson, null, 2) + '\n')
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n')


    const commitMsg = `version: ${newVersion}`

    // eslint-disable-next-line no-console
    console.log(
        execSync(`git commit -am '${commitMsg}'`),
    )

    // eslint-disable-next-line no-console
    console.log(
        execSync(`git tag ${newVersion}`),
    )

    /* eslint-enable import/no-dynamic-require, global-require */
}
