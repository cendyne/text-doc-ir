# Changelog

## [0.2.0](https://github.com/cendyne/text-doc-ir/compare/text-doc-ir-v0.1.0...text-doc-ir-v0.2.0) (2026-02-15)


### Features

* upgrade to document-ir 0.4.0 with badge and footnote support ([#10](https://github.com/cendyne/text-doc-ir/issues/10)) ([5e5ed51](https://github.com/cendyne/text-doc-ir/commit/5e5ed51a7d6ae650bea164cea3c4f8bebf1806bd))

## [0.1.0](https://github.com/cendyne/text-doc-ir/compare/text-doc-ir-v0.0.14...text-doc-ir-v0.1.0) (2026-02-13)


### Features

* implement code block decoration, line numbers, and diff rendering ([3323676](https://github.com/cendyne/text-doc-ir/commit/33236763427e937f18e8d04d7cdcb736e9bdb477))
* implement rendering for all new node types ([7c7b348](https://github.com/cendyne/text-doc-ir/commit/7c7b34872951b4be2e96d05b73760331c20c16fb))
* migrate build system from Deno to Bun + Vite ([1b4d5f3](https://github.com/cendyne/text-doc-ir/commit/1b4d5f37d1289c10703aa328d26e21219dbb8313))
* migrate tests from Deno to Bun test runner ([a06adff](https://github.com/cendyne/text-doc-ir/commit/a06adff59d7175591ee77855c155af11bf8938d6))
* modernize CI/CD with Bun, OIDC auth, and release-please ([28205d1](https://github.com/cendyne/text-doc-ir/commit/28205d153dbf5903b70ebb1317448185645f7f5b))
* upgrade document-ir to 0.2.0 and add new node type dispatch ([c654ea3](https://github.com/cendyne/text-doc-ir/commit/c654ea32eab3175e1a2fe1c1b45d580f4cf8ee16))
* upgrade document-ir to 0.3.0 with proper type imports ([1f71232](https://github.com/cendyne/text-doc-ir/commit/1f71232b5be20bf540a1e0a3e58ddd368f1ce8dd))


### Bug Fixes

* don't break words before ending punctuation ([111db96](https://github.com/cendyne/text-doc-ir/commit/111db96bc006f85c44b281e2620ad0b0bfe40cb4))
* lints ([2d58897](https://github.com/cendyne/text-doc-ir/commit/2d58897bf3f8fa76408008b7e17dc28c7a01d171))
* prevent crashes when content overflows allocated width ([40266bd](https://github.com/cendyne/text-doc-ir/commit/40266bd037a758791912f4055ec6553127de9e12))
* resolve TypeScript strict mode errors ([334c9d4](https://github.com/cendyne/text-doc-ir/commit/334c9d4d36bcca693c313e0577c5eaed51f4113b))
* treat code nodes as inline by default, add to-text CLI utility ([b8de02a](https://github.com/cendyne/text-doc-ir/commit/b8de02a0bcbdb3fd577c2cdbb1a6091fe300d3a3))

## [0.0.14](https://github.com/cendyne/text-doc-ir/releases/tag/0.0.14) (2023-09-01)

### Miscellaneous
* Initial tracked release
