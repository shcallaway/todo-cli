# Todo

A simple, clean todo list for your command line.

## Usage

![todo.gif](todo.gif)

## Installation

You can download the latest release [here](https://github.com/shcallaway/todo/releases). I recommend moving it into `/usr/local/bin` for convenient access!

Of course, you can also download Todo from your command line:

```
curl -L https://github.com/shcallaway/todo/releases/download/v1.0/todo -o todo \
  && chmod 750 todo \
  && mv todo /usr/local/bin/todo
```

## Contributing

If you feel compelled to improve Todo, feel free to open an issue or submit a pull request.

### Dependencies

* [Node](https://nodejs.org/en/) 8.4.9
* [Yarn](https://yarnpkg.com/en/) 1.2.1

### Overview

Todo is written in [TypeScript](https://www.typescriptlang.org/). You can compile it to JavaScript via `yarn compile`. From the resulting JS, I use [Nexe](https://github.com/nexe/nexe) to create a binary executable.

### Debugging

Pass the following environment variable to see verbose logs: `DEBUG=*`.
