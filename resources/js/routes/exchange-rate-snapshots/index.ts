import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rate-snapshots',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::index
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:19
* @route '/api/exchange-rate-snapshots'
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
* @see \App\Http\Controllers\ExchangeRateSnapshotController::store
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:68
* @route '/api/exchange-rate-snapshots'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/exchange-rate-snapshots',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::store
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:68
* @route '/api/exchange-rate-snapshots'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::store
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:68
* @route '/api/exchange-rate-snapshots'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::store
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:68
* @route '/api/exchange-rate-snapshots'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::store
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:68
* @route '/api/exchange-rate-snapshots'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
export const show = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rate-snapshots/{snapshot}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
show.url = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { snapshot: args }
    }

    if (Array.isArray(args)) {
        args = {
            snapshot: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        snapshot: args.snapshot,
    }

    return show.definition.url
            .replace('{snapshot}', parsedArgs.snapshot.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
show.get = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
show.head = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
const showForm = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
showForm.get = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateSnapshotController::show
* @see app/Http/Controllers/ExchangeRateSnapshotController.php:112
* @route '/api/exchange-rate-snapshots/{snapshot}'
*/
showForm.head = (args: { snapshot: string | number } | [snapshot: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

const exchangeRateSnapshots = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
}

export default exchangeRateSnapshots