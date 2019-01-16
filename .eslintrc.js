'use strict'

module.exports = {
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
    },

    extends: [
        require.resolve('eslint-config-airbnb-base'),
    ],

    globals: {
        chrome: false,
        window: false,
    },

    rules: {
        // 5.1 https://github.com/airbnb/javascript#destructuring--object
        'prefer-destructuring': ['warn'],

        // 6.3 https://github.com/airbnb/javascript#es6-template-literals
        'prefer-template': ['off'],

        // 13.7 https://github.com/airbnb/javascript#variables--linebreak
        'operator-linebreak': ['error', 'after', {
            overrides: {
                '?': 'before',
                ':': 'before',
            },
        }],

        // (?) 14.4 https://github.com/airbnb/javascript#hoisting--declarations
        // Present in `eslint-config-airbnb-base` but not in the README
        'no-use-before-define': ['error', {
            functions: false,
            classes: true,
            variables: true,
        }],

        // 16.2 https://github.com/airbnb/javascript#blocks--cuddled-elses
        'brace-style': ['error', 'stroustrup'],

        // 19.1 https://github.com/airbnb/javascript#whitespace--spaces
        indent: ['error', 4, {
            SwitchCase: 1,
        }],

        // 19.19 https://github.com/airbnb/javascript#whitespace--no-multiple-empty-lines
        'no-multiple-empty-lines': ['error', {
            max: 3,
            maxBOF: 0,
            maxEOF: 0,
        }],

        // 21.1 https://github.com/airbnb/javascript#semicolons--required
        semi: ['error', 'never'],



        // ES modules in browsers are resolved with extensions
        'import/extensions': ['error', 'always'],
    },

    overrides: [
        {
            files: [
                '.eslintrc.js',
                'scripts/**',
                'src/content-selection-watcher.js',
            ],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
}
