eosic
=====

Unofficial toolset to operate with EOSIO platform

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/eosic.svg)](https://npmjs.org/package/eosic)
[![CircleCI](https://circleci.com/gh/alerdenisov/eosic/tree/master.svg?style=shield)](https://circleci.com/gh/alerdenisov/eosic/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/alerdenisov/eosic?branch=master&svg=true)](https://ci.appveyor.com/project/alerdenisov/eosic/branch/master)
[![Codecov](https://codecov.io/gh/alerdenisov/eosic/branch/master/graph/badge.svg)](https://codecov.io/gh/alerdenisov/eosic)
[![Downloads/week](https://img.shields.io/npm/dw/eosic.svg)](https://npmjs.org/package/eosic)
[![License](https://img.shields.io/npm/l/eosic.svg)](https://github.com/alerdenisov/eosic/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g eosic
$ eosic COMMAND
running command...
$ eosic (-v|--version|version)
eosic/0.0.1 darwin-x64 node-v9.8.0
$ eosic --help [COMMAND]
USAGE
  $ eosic COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`eosic compile`](#eosic-compile)
* [`eosic contract NAME`](#eosic-contract-name)
* [`eosic help [COMMAND]`](#eosic-help-command)
* [`eosic init`](#eosic-init)
* [`eosic internal:base-command`](#eosic-internalbase-command)
* [`eosic internal:generator-command`](#eosic-internalgenerator-command)
* [`eosic start`](#eosic-start)
* [`eosic test`](#eosic-test)

## `eosic compile`

```
USAGE
  $ eosic compile

OPTIONS
  -c, --cwd=cwd  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory (default is current
                 directory)

  -f, --force

  -h, --help     show CLI help

  -q, --quiet    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/compile.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/compile.js)_

## `eosic contract NAME`

create new contract

```
USAGE
  $ eosic contract NAME

ARGUMENTS
  NAME  Name of generated contract

OPTIONS
  -b, --withBuiltin

  -c, --cwd=cwd                  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory
                                 (default is current directory)

  -d, --description=description

  -f, --force

  -h, --help                     show CLI help

  -q, --quiet                    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/contract.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/contract.js)_

## `eosic help [COMMAND]`

display help for eosic

```
USAGE
  $ eosic help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.0.5/src/commands/help.ts)_

## `eosic init`

Initialize EOSIC project

```
USAGE
  $ eosic init

OPTIONS
  -b, --withBuiltin

  -c, --cwd=cwd                  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory
                                 (default is current directory)

  -d, --description=description

  -f, --force

  -h, --help                     show CLI help

  -q, --quiet                    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/init.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/init.js)_

## `eosic internal:base-command`

```
USAGE
  $ eosic internal:base-command

OPTIONS
  -c, --cwd=cwd  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory (default is current
                 directory)

  -f, --force

  -h, --help     show CLI help

  -q, --quiet    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/internal/base-command.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/internal/base-command.js)_

## `eosic internal:generator-command`

```
USAGE
  $ eosic internal:generator-command

OPTIONS
  -c, --cwd=cwd  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory (default is current
                 directory)

  -f, --force

  -h, --help     show CLI help

  -q, --quiet    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/internal/generator-command.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/internal/generator-command.js)_

## `eosic start`

```
USAGE
  $ eosic start

OPTIONS
  -c, --cwd=cwd  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory (default is current
                 directory)

  -f, --force

  -h, --help     show CLI help

  -q, --quiet    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/start.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/start.js)_

## `eosic test`

```
USAGE
  $ eosic test

OPTIONS
  -c, --cwd=cwd  [default: /Users/aler/crypto/ducatur/exchange/packages/eosic] custom work directory (default is current
                 directory)

  -f, --force

  -h, --help     show CLI help

  -q, --quiet    runs in quiet (non-interactive) mode

  -v, --verbose
```

_See code: [lib/commands/test.js](https://github.com/eos-change/eosic/blob/v0.0.1/lib/commands/test.js)_
<!-- commandsstop -->
