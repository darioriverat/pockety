import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:21
* @route '/api/balance-sheet'
*/
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm
