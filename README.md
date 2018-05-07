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

If you encounter a bug or think of an enhancement while using Todo, please open an issue or a pull request.

### Dependencies

* [Node](https://nodejs.org/en/) 8.4.9
* [Yarn](https://yarnpkg.com/en/) 1.2.1

### Compilation

Todo is written in [TypeScript](https://www.typescriptlang.org/). You can compile it to JavaScript via `yarn compile`. Create a binary from the resulting JS with `yarn binarize`. 

I recommend practicing test-driven developement because these compilation steps slow down the feedback loop significantly.

### Tests

Todo is tested using [Mocha]() and [Sinon](). You can run the tests via `yarn test`.

### Debugging

Set the following environment variable to see verbose logs: `DEBUG=*`

This feature is available even while using Todo in binary form!