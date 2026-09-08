# Pockety

Personal finance manager for tracking income, expenses, and budgets.

## Local development

| |                                             |
|---|---------------------------------------------|
| **Local URL** | http://dev.pockety.com:8080/ (default port) |
| **Container** | `web_app`                                   |
| **Source mount** | `/var/www/vhosts`                           |

### Common commands

```shell
# Shell in the container (from this repo)
task shell

# Run PHPUnit via Artisan
task tests
```

First-time setup: with the stack running, open a shell (`task shell` or `make shell` in docker) and run `install-app`.

Ensure `/etc/hosts` includes `dev.pockety.com` pointing at `127.0.0.1`.
---
