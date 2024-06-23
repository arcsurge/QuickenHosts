import * as path from 'node:path'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import vue from '@vitejs/plugin-vue'
import { ElementPlusResolver, ArcoResolver } from 'unplugin-vue-components/resolvers'
import eslintPlugin from '@nabla/vite-plugin-eslint'
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vitejs.dev/config/
export default defineConfig({
    lintOnSave: true,
    plugins: [
        vue(),
        eslintPlugin({
            include: ['src/**/*.ts', 'src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue']
        }),
        topLevelAwait(),
        AutoImport({
            imports: ['vue'],
            resolvers: [ElementPlusResolver(), ArcoResolver()],
            dts: 'src/types/auto-imports.d.ts',
            vueTemplate: true,
            eslintrc: {
                enabled: true // 1、改为true用于生成eslint配置。2、生成后改回false，避免重复生成消耗
            }
        }),
        Components({
            resolvers: [
                ElementPlusResolver(),
                ArcoResolver({
                    sideEffect: true
                })
            ],
            dirs: ['src/components'],
            dts: 'src/types/components.d.ts'
        })
    ],
    base: './',
    resolve: {
        // 设置路径别名
        alias: {
            '@/': `${path.resolve(__dirname, 'src')}/`,
            '@': path.resolve(__dirname, './src'),
            '*': path.resolve('')
        }
    },
    build: {
        chunkSizeWarningLimit: 1000
    }
})
