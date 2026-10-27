import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, lazyPlugins } from 'vite-plus';

// Vite server configuration
// 0.0.0.0 wildcard allows connections from any IP address. This configuration
// facilitates local development with Docker containers.
const viteServerHost = process.env.VITE_SERVER_HOST || '0.0.0.0';
const viteServerPort = process.env.VITE_SERVER_PORT || 5173;

// HMR server configuration
// 0.0.0.0 wildcard allows connections from any IP address. This configuration
// facilitates local development with Docker containers.
const hmrServerHost = process.env.VITE_HMR_SERVER_HOST || '0.0.0.0';
const hmrServerPort = process.env.VITE_HMR_SERVER_PORT || viteServerPort;

const corsOrigins = process.env.VITE_CORS_ORIGINS?.split(',') || [
    `http://${hmrServerHost}:${hmrServerPort}`,
];

export default defineConfig({
    plugins: lazyPlugins(() => [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
        // Wayfinder requires php artisan; skip when PHP is unavailable on the host.
        ...(process.env.SKIP_WAYFINDER === '1'
            ? []
            : [
                  wayfinder({
                      formVariants: true,
                  }),
              ]),
    ]),
    server: {
        host: viteServerHost,
        port: viteServerPort,
        strictPort: true,
        cors: {
            origin: corsOrigins,
        },
        hmr: {
            host: hmrServerHost,
            port: hmrServerPort,
        },
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
            'tests/fixtures/**',
            '.dsh/**',
            'docs/**',
            'scripts/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            'package-lock.json',
            'feature_list.json',
            'phpstan-baseline.neon',
            'tsconfig.json',
            'Taskfile.yml',
            'AGENTS.md',
            'README.md',
            '.dsh/**',
            'docs/**',
            'public/**',
            'scripts/**',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
            'resources/views/mail/*',
            'tests/fixtures/**',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            entryPoint: 'resources/css/app.css',
        },
    },
});
