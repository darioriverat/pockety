import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
export const statistics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(options),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/exchange-rates/import/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
statistics.url = (options?: RouteQueryOptions) => {
    return statistics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
statistics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
statistics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
const statisticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
statisticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExchangeRateImportController::statistics
* @see app/Http/Controllers/ExchangeRateImportController.php:52
* @route '/api/exchange-rates/import/statistics'
*/
statisticsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

statistics.form = statisticsForm

const ExchangeRateImportController = { importMethod, statistics, import: importMethod }

export default ExchangeRateImportController