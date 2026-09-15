import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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
