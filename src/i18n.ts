/** Localized labels for tool responses (en / zh / ru). */

export type Lang = 'en' | 'zh' | 'ru'

export function pickLang(lang?: string): Lang {
  if (lang === 'zh' || lang === 'ru' || lang === 'en') return lang
  if (lang?.startsWith('zh')) return 'zh'
  if (lang?.startsWith('ru')) return 'ru'
  return 'en'
}

type Dict = {
  found: (n: number) => string
  similarTo: (name: string) => string
  installWith: string
  runToInstall: string
  installNote: string
  compatibility: string
  works: string
  installFailed: string
  timedOut: string
  untested: string
  stars: string
  weeklyDownloads: string
  versions: string
  latest: string
  trending: (by: string) => string
  notFound: (slug: string) => string
  apiError: (msg: string) => string
  capabilities: string
  by: string
}

const EN: Dict = {
  found: (n) => `Found ${n} plugin(s)`,
  similarTo: (name) => `Plugins similar to ${name}`,
  installWith: 'Install command',
  runToInstall: 'To install, run:',
  installNote:
    'The command installs the plugin into the given DSH profile via pnpm. ' +
    'Run it yourself (e.g. with the bash tool) or share it with the user. ' +
    'The running harness picks up new client plugins on browser reload; host plugins may need a harness restart.',
  compatibility: 'Compatibility (sandbox auto-tests)',
  works: 'works',
  installFailed: 'install failed',
  timedOut: 'timeout',
  untested: 'untested',
  stars: 'stars',
  weeklyDownloads: 'downloads/week',
  versions: 'versions',
  latest: 'latest',
  trending: (by) => `Trending plugins (by ${by})`,
  notFound: (slug) => `Plugin "${slug}" not found in the marketplace.`,
  apiError: (msg) => `Marketplace API error: ${msg}`,
  capabilities: 'capabilities',
  by: 'by',
}

const ZH: Dict = {
  found: (n) => `找到 ${n} 个插件`,
  similarTo: (name) => `与 ${name} 相似的插件`,
  installWith: '安装命令',
  runToInstall: '运行以下命令即可安装：',
  installNote:
    '该命令通过 pnpm 将插件安装到指定的 DSH profile。请自行执行（例如用 bash 工具）或把命令交给用户。' +
    '运行中的 harness 在浏览器刷新后会加载新的客户端插件；宿主侧插件可能需要重启 harness。',
  compatibility: '兼容性（沙箱自动测试）',
  works: '正常',
  installFailed: '安装失败',
  timedOut: '超时',
  untested: '未测试',
  stars: '星标',
  weeklyDownloads: '周下载',
  versions: '版本',
  latest: '最新',
  trending: (by) => `热门插件（按${by === 'stars' ? '星标' : by === 'downloads' ? '下载量' : by === 'installs' ? '安装量' : '更新时间'}）`,
  notFound: (slug) => `市场里没有找到插件「${slug}」。`,
  apiError: (msg) => `市场 API 出错：${msg}`,
  capabilities: '能力',
  by: '作者',
}

const RU: Dict = {
  found: (n) => `Найдено плагинов: ${n}`,
  similarTo: (name) => `Похожие на ${name}`,
  installWith: 'Команда установки',
  runToInstall: 'Для установки выполните:',
  installNote:
    'Команда ставит плагин в указанный DSH-профиль через pnpm. Выполните её сами (например, инструментом bash) ' +
    'или передайте пользователю. Работающий harness подхватит клиентские плагины после обновления страницы браузера; ' +
    'для host-плагинов может понадобиться перезапуск harness.',
  compatibility: 'Совместимость (автотесты в песочнице)',
  works: 'работает',
  installFailed: 'ошибка установки',
  timedOut: 'таймаут',
  untested: 'не тестировался',
  stars: 'звёзд',
  weeklyDownloads: 'загрузок/нед',
  versions: 'версии',
  latest: 'последняя',
  trending: (by) => `Популярные плагины (по ${by === 'stars' ? 'звёздам' : by === 'downloads' ? 'загрузкам' : by === 'installs' ? 'установкам' : 'обновлениям'})`,
  notFound: (slug) => `Плагин «${slug}» не найден в маркетплейсе.`,
  apiError: (msg) => `Ошибка API маркетплейса: ${msg}`,
  capabilities: 'возможности',
  by: 'автор',
}

export function labels(lang: Lang): Dict {
  return lang === 'zh' ? ZH : lang === 'ru' ? RU : EN
}
