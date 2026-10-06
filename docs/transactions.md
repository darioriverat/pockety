# Transactions

Transactions are the individual credits and expenses you record against accounts and categories.

## The transaction list

Open **Transactions** to see a paginated list of your entries. Each row shows the date, period, concept or category, account when present, amounts, and related details. Sort and page through the list as needed.

## Filters, including account

The filter row lets you narrow the list by:

- Period (YYYYMM)
- Account
- Category
- Currency
- Recurring flag
- Free-text search

Choose an account to show only that account’s transactions. Leave the account filter empty (all accounts) to see every transaction again. Clearing filters clears the account filter as well.

You can also open the page with `?account={id}` to start with that account selected. The same pattern applies for period and category query parameters.

## Create a transaction

1. Open the create dialog from the transactions page.
2. Enter the date, period, category, optional account, currency, amount, and any comments or flags the form provides.
3. Save.

Income categories may require an account; expense flows follow the validation messages shown in the form.

## Edit a transaction

Use **Edit** on a row to open the dialog with the existing values. Change the fields you need and save. The list refreshes with the updated entry.

## Amounts stay in the currency entered

When you enter an amount in CAD, USD, or COP, that amount is stored in that currency. Pockety does not rewrite the entered currency into another one at save time. Reports and conversions use exchange-rate assignments when they need a common currency; the original entry remains in the currency you typed.
