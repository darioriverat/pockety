import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
export const reconciliation = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reconciliation.url(args, options),
    method: 'get',
})

reconciliation.definition = {
    methods: ["get","head"],
    url: '/api/periods/{period}/reconciliation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
reconciliation.url = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { period: args }
    }

    if (Array.isArray(args)) {
        args = {
            period: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        period: args.period,
    }

    return reconciliation.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
reconciliation.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reconciliation.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
reconciliation.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reconciliation.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
const reconciliationForm = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reconciliation.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
reconciliationForm.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reconciliation.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::reconciliation
* @see app/Http/Controllers/ReconciliationController.php:20
* @route '/api/periods/{period}/reconciliation'
*/
reconciliationForm.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reconciliation.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

reconciliation.form = reconciliationForm

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
export const balanceSheet = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balanceSheet.url(args, options),
    method: 'get',
})

balanceSheet.definition = {
    methods: ["get","head"],
    url: '/api/periods/{period}/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
balanceSheet.url = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { period: args }
    }

    if (Array.isArray(args)) {
        args = {
            period: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        period: args.period,
    }

    return balanceSheet.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
balanceSheet.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balanceSheet.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
balanceSheet.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: balanceSheet.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
const balanceSheetForm = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: balanceSheet.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
balanceSheetForm.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: balanceSheet.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::balanceSheet
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/periods/{period}/balance-sheet'
*/
balanceSheetForm.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: balanceSheet.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

balanceSheet.form = balanceSheetForm

const periods = {
    reconciliation: Object.assign(reconciliation, reconciliation),
    balanceSheet: Object.assign(balanceSheet, balanceSheet),
}

export default periods