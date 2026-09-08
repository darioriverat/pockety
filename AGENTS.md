# AGENTS Instructions

## Project Information

- **GitHub Repository:** https://github.com/dariorivera/pockety

## Environment Setup

Local development runs in the [pleets/devbox-station](https://github.com/pleets/devbox-station) stack.
This repo is usually located on `~/www-apps/devbox-station` on your local machine. Custom configuration can be
found in the folder `~/www-apps/devbox-station/user`.

If defaults are used, the application should be accessible at [http://dev.pockety.com:8080/](http://dev.pockety.com:8080/)
in your browser.

For more information on the stack, check the [devbox-station README](https://github.com/pleets/devbox-station#readme).
Available commands for interacting with the environments can be found in the `devbox-station` Makefile.

### Accessing the Container Shell

From this repository:

```shell
task shell
```

To login with the `root` user execute:
```shell
task shell-root
```

## Running Unit Tests

```shell
task tests
```
