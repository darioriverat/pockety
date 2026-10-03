import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/period-balances',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::show
* @see app/Http/Controllers/PeriodBalanceController.php:22
* @route '/api/period-balances'
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

/**
* @see \App\Http\Controllers\PeriodBalanceController::store
* @see app/Http/Controllers/PeriodBalanceController.php:57
* @route '/api/period-balances'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/period-balances',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PeriodBalanceController::store
* @see app/Http/Controllers/PeriodBalanceController.php:57
* @route '/api/period-balances'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeriodBalanceController::store
* @see app/Http/Controllers/PeriodBalanceController.php:57
* @route '/api/period-balances'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::store
* @see app/Http/Controllers/PeriodBalanceController.php:57
* @route '/api/period-balances'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PeriodBalanceController::store
* @see app/Http/Controllers/PeriodBalanceController.php:57
* @route '/api/period-balances'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const PeriodBalanceController = { show, store }

export default PeriodBalanceController