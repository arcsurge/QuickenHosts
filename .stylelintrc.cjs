module.exports = {
    root: true,
    extends: ['stylelint-config-standard', 'stylelint-config-recess-order', 'stylelint-config-html/vue', 'stylelint-config-recommended-vue'], // 指定不同文件对应的解析器
    overrides: [{
        files: ['**/*.{vue,html}'], customSyntax: 'postcss-html'
    }],
    defaultSeverity: 'warning',
    rules: {
        'at-rule-no-unknown': [true, {
            ignoreAtRules: ['plugin']
        }], 'rule-empty-line-before': ['always', {
            except: ['after-single-line-comment', 'first-nested']
        }], 'selector-pseudo-class-no-unknown': [true, {
            ignorePseudoClasses: ['deep']
        }]
    },
    ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.tsx', '**/*.ts', 'node_modules/**', 'dist/**']
};
