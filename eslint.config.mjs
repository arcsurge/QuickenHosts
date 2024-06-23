import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import parserVue from 'vue-eslint-parser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const autoImport = require('./.eslintrc-auto-import.json');
export default [// eslint 默认推荐规则
    pluginJs.configs.recommended, // ts 默认推荐规则
    ...tseslint.configs.recommended, // vue3 基础推荐规则
    ...pluginVue.configs['flat/essential'], {
        ignores: ['**/*.css', '**/*.scss', '/*.json', '/*.js', 'node_modules', 'dist']
    }, {
        plugins: {
            '@typescript-eslint': tseslint.plugin
        }, languageOptions: {
            globals: {
                ...autoImport.globals, ...globals.browser, ...globals.es2021, ...globals.node
            }, parser: parserVue, parserOptions: {
                parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module'
            }
        }, rules: {
            '@typescript-eslint/no-var-requires': 0, // 让.eslintrc.js文件略过@typescript-eslint/no-var-requires检查
            'newline-per-chained-call': [`error`, {
                ignoreChainWithDepth: 5
            }], // 要求链式调用多于两层时换行
            'array-bracket-spacing': [2, 'never'], // 不允许数组括号内的空格
            'template-curly-spacing': [2, 'never'], // 不允许大括号内的空格
            'no-with': 2, // 禁用with
            'no-var': 2, // 禁用var
            'no-whitespace-before-property': 2, // 如果对象的属性位于同一行上，不允许围绕点或在开头括号之前留出空白
            'no-trailing-spaces': 2, // 不允许在行尾添加尾随空白
            'no-multiple-empty-lines': [2, { max: 1 }], // 最多一个空行
            'no-mixed-spaces-and-tabs': 2, // 不允许使用混合空格和制表符进行缩进
            'no-irregular-whitespace': 2, // 捕获无效的空格
            'no-const-assign': 2, // 不能修改使用const关键字声明的变量
            'no-console': 'off',
            'comma-spacing': 0, // 逗号前后的空格
            'comma-style': [2, 'last'], // （默认）与数组元素，对象属性或变量声明在同一行之后和同一行需要逗号
            'comma-dangle': [2, 'never'], // 逗号不使用悬挂
            'brace-style': [2, '1tbs', { allowSingleLine: true }], // 大括号样式允许单行
            'dot-location': 0, // 成员表达式中的点应与属性部分位于同一行
            'dot-notation': [0, {
                allowKeywords: true
            }], // 避免不必要的方括号
            'vue/html-indent': ['error', 4],
            'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'never' }],
            'vue/max-attributes-per-line': 'off',
            indent: ['error', 4, {
                "SwitchCase": 1
            }], // vue格式文件的3个tag顺序，前两个顺序无所谓
            'vue/component-tags-order': ['error', {
                order: [['template', 'script'], 'style']
            }],
            'vue/custom-event-name-casing': [2, 'camelCase'], // vue的自定义事件名必须是小驼峰
            'no-floating-decimal': 2, // 禁止省略浮点数中的0，(比如const num = .5)
            eqeqeq: ['error', 'always'], // 强制在任何情况下都使用 === 和 !==
            // 注释文字前面至少要有一个空格
            'spaced-comment': [1, 'always', {
                line: {
                    markers: ['/'], exceptions: ['-', '+']
                }, block: {
                    markers: ['!'], exceptions: ['*'], balanced: true
                }
            }]
        }
    }
];
