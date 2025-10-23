import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BxF1Jx-o.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/age-groups.astro.mjs');
const _page2 = () => import('./pages/api/auth/login.astro.mjs');
const _page3 = () => import('./pages/api/auth/logout.astro.mjs');
const _page4 = () => import('./pages/api/auth/me.astro.mjs');
const _page5 = () => import('./pages/api/auth/register.astro.mjs');
const _page6 = () => import('./pages/api/events.astro.mjs');
const _page7 = () => import('./pages/api/profiles/me.astro.mjs');
const _page8 = () => import('./pages/api/props.astro.mjs');
const _page9 = () => import('./pages/api/quests/generate.astro.mjs');
const _page10 = () => import('./pages/api/quests/_id_/complete.astro.mjs');
const _page11 = () => import('./pages/api/quests/_id_/favorite.astro.mjs');
const _page12 = () => import('./pages/api/quests/_id_/start.astro.mjs');
const _page13 = () => import('./pages/api/quests/_id_.astro.mjs');
const _page14 = () => import('./pages/api/quests.astro.mjs');
const _page15 = () => import('./pages/auth/callback.astro.mjs');
const _page16 = () => import('./pages/auth/update-password.astro.mjs');
const _page17 = () => import('./pages/dashboard/generate.astro.mjs');
const _page18 = () => import('./pages/dashboard/quest/_id_.astro.mjs');
const _page19 = () => import('./pages/dashboard.astro.mjs');
const _page20 = () => import('./pages/login.astro.mjs');
const _page21 = () => import('./pages/register.astro.mjs');
const _page22 = () => import('./pages/reset-password.astro.mjs');
const _page23 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/age-groups.ts", _page1],
    ["src/pages/api/auth/login.ts", _page2],
    ["src/pages/api/auth/logout.ts", _page3],
    ["src/pages/api/auth/me.ts", _page4],
    ["src/pages/api/auth/register.ts", _page5],
    ["src/pages/api/events.ts", _page6],
    ["src/pages/api/profiles/me.ts", _page7],
    ["src/pages/api/props.ts", _page8],
    ["src/pages/api/quests/generate.ts", _page9],
    ["src/pages/api/quests/[id]/complete.ts", _page10],
    ["src/pages/api/quests/[id]/favorite.ts", _page11],
    ["src/pages/api/quests/[id]/start.ts", _page12],
    ["src/pages/api/quests/[id].ts", _page13],
    ["src/pages/api/quests/index.ts", _page14],
    ["src/pages/auth/callback.astro", _page15],
    ["src/pages/auth/update-password.astro", _page16],
    ["src/pages/dashboard/generate.astro", _page17],
    ["src/pages/dashboard/quest/[id].astro", _page18],
    ["src/pages/dashboard/index.astro", _page19],
    ["src/pages/login.astro", _page20],
    ["src/pages/register.astro", _page21],
    ["src/pages/reset-password.astro", _page22],
    ["src/pages/index.astro", _page23]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "f0674f05-ce29-481a-9794-e531d6db2363"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
