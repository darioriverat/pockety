# Accounts

Accounts hold the balances and transactions you track in Pockety. Each account belongs to you and can use CAD, USD, or COP as its primary currency.

## Create an account

1. Open **Accounts**.
2. Choose **Create account** (or the equivalent action on the page).
3. Enter a name, choose a type (`bank`, `investment`, `liability`, or `receivable`), optionally set a primary currency and notes, then save.

The new account appears in your list and is available when you record transactions or manage balances.

## Edit an account

Each account row has an **Edit** action. The dialog opens with the current name, type, primary currency, notes, and active flag.

You can change:

- Name
- Primary currency (CAD, USD, COP, or none)
- Notes
- Active flag

Save with **Update**. The list refreshes to show the new values.

## Type lock when transactions exist

Account type can change only while the account has no transactions.

If at least one transaction is registered for the account (including soft-deleted ones when soft deletes apply), the type control is disabled and the dialog explains that the type cannot change because transactions are registered. Name, primary currency, notes, and active status can still be edited.

If a type change is submitted anyway, the API returns a validation error and the stored type stays unchanged.

## Primary currency

Primary currency is the currency you treat as the account’s main denomination. It does not convert historical amounts; it guides how the account is displayed and used in forms. Supported values are CAD, USD, and COP.

## Active flag

Turning an account inactive hides it from everyday pickers where only active accounts are shown, without deleting its history. You can edit the account later and set it active again.

## Manage Balances

Use **Manage Balances** on an account to record balance snapshots for specific dates in CAD, USD, and COP.

- The dialog keeps the title, description, and new-balance form visible.
- The recorded-balances list scrolls when there are many rows (the dialog height is limited to about 85% of the viewport).
- With a short list, the dialog fits its content; with a long list, scroll inside the list to reach the first and last rows while still using the form.
