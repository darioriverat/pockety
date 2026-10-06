# Reconciliation

Reconciliation is a read-only check for one accounting period. It helps you confirm that recorded account balances line up with balances computed from transactions before you register the month elsewhere.

## Check one YYYYMM period

1. Open **Reconciliation**.
2. Select a period in `YYYYMM` form (for example `202601`).
3. Review the per-account and summary results for that period only.

Changing the period reloads the check; nothing on this page writes month-end registration.

## Recorded versus computed balances

For each account in the period, reconciliation compares:

- **Recorded** — the balance you entered through Manage Balances (or related recorded figures)
- **Computed** — the balance derived from transactions and related calculations for that period

Both sides are shown in CAD, USD, and COP where available so you can inspect each currency.

## Variance

Variance is the difference between recorded and computed amounts for each currency. Large variances are highlighted so you can investigate missing transactions, wrong recorded balances, or exchange-rate assignment issues.

## Balanced versus unbalanced

A period (or account) is **balanced** when variances are within the expected tolerance, and **unbalanced** when they are not. The page shows clear status badges so you can see the overall result at a glance.

## Reconciliation does not register the month

Reconciliation never stores the month-end period balance. It is a verification view only. When the computed figures look right, go to **Period Balances** to register (or overwrite) the month-end figures.
