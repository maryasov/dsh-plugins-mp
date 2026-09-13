# dsh-plugins-mp

Плагин маркетплейса для DeepSeek Harness: кастомная вкладка-каталог в
[DSH better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) + инструменты
агентского доступа (`mp_search`, `mp_similar`, `mp_details`, `mp_install`, `mp_trending`)
поверх API [dsh-plugins.vue-z.com](https://dsh-plugins.vue-z.com).

## Установка

```sh
dsh plugin --profile web add dsh-plugins-mp
```

(после публикации в npm; до того — `add github:maryasov/dsh-plugins-mp`).

Вкладка «Marketplace» появляется в боковой панели, если установлен
`dsh-better-sidebar` (мягкая зависимость: без него плагин просто не рисует вкладку).
Host-инструменты работают всегда.

## Инструменты для агента

| Инструмент | Что делает |
|---|---|
| `mp_search` | поиск по каталогу (текст, категория, профиль, сортировки) + команды установки |
| `mp_similar` | похожие плагины (векторный поиск) |
| `mp_details` | полное досье: локализованное описание, версии, совместимость по релизам DSH (автотесты песочницы), теги |
| `mp_install` | команда `dsh plugin --profile <p> add <source>` (ничего не исполняет сама) |
| `mp_trending` | популярное: по звёздам / загрузкам / обновлениям |

Ответы локализуются (en / zh / ru — параметр `lang`).

## Разработка

```sh
pnpm install
pnpm build        # tsdown: node half (ESM) + client half (CJS-замыкание)
pnpm typecheck
```

Проверка в DSH: `dsh plugin --profile mp-test add <путь к репо>` →
`dsh --profile mp-test --dump-config` (exit 0 = бандл смонтирован).

Артефакты `lib/` коммитятся: при установке из git сборка не нужна (соглашение
экосистемы — `@deepseek-ai/*` остаются внешними импортами и резолвятся хостом).

Исходники площадки — приватный репозиторий `maryasov/dsh-plugins-marketplace`.
