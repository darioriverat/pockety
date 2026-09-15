import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
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
* @see app/Http/Controllers/ExchangeRateController.php:38
* @route '/api/exchange-rates'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
* @route '/api/exchange-rates'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
* @route '/api/exchange-rates'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
* @route '/api/exchange-rates'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
* @route '/api/exchange-rates'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::index
* @see app/Http/Controllers/ExchangeRateController.php:38
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
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:50
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
* @see app/Http/Controllers/ExchangeRateController.php:50
* @route '/api/exchange-rates'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:50
* @route '/api/exchange-rates'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:50
* @route '/api/exchange-rates'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateController::store
* @see app/Http/Controllers/ExchangeRateController.php:50
* @route '/api/exchange-rates'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const ExchangeRateController = { index, show, store }

export default ExchangeRateController