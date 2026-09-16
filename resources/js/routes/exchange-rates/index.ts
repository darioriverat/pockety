import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:64
* @route '/api/exchange-rates'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rates/show',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::show
* @see app/Http/Controllers/ExchangeRateController.php:14
* @route '/api/exchange-rates/show'
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
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
export const showByPeriod = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showByPeriod.url(args, options),
    method: 'get',
})

showByPeriod.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rates/{period}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
showByPeriod.url = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showByPeriod.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
showByPeriod.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showByPeriod.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
showByPeriod.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showByPeriod.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
const showByPeriodForm = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showByPeriod.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
showByPeriodForm.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showByPeriod.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::showByPeriod
* @see app/Http/Controllers/ExchangeRateController.php:28
* @route '/api/exchange-rates/{period}'
*/
showByPeriodForm.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showByPeriod.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

showByPeriod.form = showByPeriodForm

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:76
* @route '/api/exchange-rates'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/exchange-rates',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:76
* @route '/api/exchange-rates'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:76
* @route '/api/exchange-rates'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:76
* @route '/api/exchange-rates'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:76
* @route '/api/exchange-rates'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ExchangeRateImportController::importMethod
* @see app/Http/Controllers/ExchangeRateImportController.php:18
* @route '/api/exchange-rates/import'
*/
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/api/exchange-rates/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExchangeRateImportController::importMethod
* @see app/Http/Controllers/ExchangeRateImportController.php:18
* @route '/api/exchange-rates/import'
*/
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateImportController::importMethod
* @see app/Http/Controllers/ExchangeRateImportController.php:18
* @route '/api/exchange-rates/import'
*/
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::importMethod
* @see app/Http/Controllers/ExchangeRateImportController.php:18
* @route '/api/exchange-rates/import'
*/
const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::importMethod
* @see app/Http/Controllers/ExchangeRateImportController.php:18
* @route '/api/exchange-rates/import'
*/
importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

importMethod.form = importMethodForm
