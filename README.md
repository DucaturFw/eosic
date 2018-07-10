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
eosic/0.0.01 darwin-x64 node-v9.8.0
$ eosic --help [COMMAND]
USAGE
  $ eosic COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`eosic hello [FILE]`](#eosic-hello-file)
* [`eosic help [COMMAND]`](#eosic-help-command)

## `eosic hello [FILE]`

describe the command here

```
USAGE
  $ eosic hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ eosic hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/alerdenisov/eosic/blob/v0.0.01/src/commands/hello.ts)_

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
<!-- commandsstop -->
