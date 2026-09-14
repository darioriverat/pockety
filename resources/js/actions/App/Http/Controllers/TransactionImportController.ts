import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TransactionImportController::importMethod
* @see app/Http/Controllers/TransactionImportController.php:18
* @route '/api/transactions/import'
*/
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/api/transactions/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TransactionImportController::importMethod
* @see app/Http/Controllers/TransactionImportController.php:18
* @route '/api/transactions/import'
*/
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionImportController::importMethod
* @see app/Http/Controllers/TransactionImportController.php:18
* @route '/api/transactions/import'
*/
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionImportController::importMethod
* @see app/Http/Controllers/TransactionImportController.php:18
* @route '/api/transactions/import'
*/
const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionImportController::importMethod
* @see app/Http/Controllers/TransactionImportController.php:18
* @route '/api/transactions/import'
*/
importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

importMethod.form = importMethodForm

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
export const statistics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(options),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/transactions/import/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
statistics.url = (options?: RouteQueryOptions) => {
    return statistics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
statistics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
statistics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
const statisticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
*/
statisticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionImportController::statistics
* @see app/Http/Controllers/TransactionImportController.php:53
* @route '/api/transactions/import/statistics'
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

/**
* @see \App\Http\Controllers\TransactionImportController::clear
* @see app/Http/Controllers/TransactionImportController.php:65
* @route '/api/transactions/import/clear'
*/
export const clear = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clear.url(options),
    method: 'post',
})

clear.definition = {
    methods: ["post"],
    url: '/api/transactions/import/clear',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TransactionImportController::clear
* @see app/Http/Controllers/TransactionImportController.php:65
* @route '/api/transactions/import/clear'
*/
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionImportController::clear
* @see app/Http/Controllers/TransactionImportController.php:65
* @route '/api/transactions/import/clear'
*/
clear.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clear.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionImportController::clear
* @see app/Http/Controllers/TransactionImportController.php:65
* @route '/api/transactions/import/clear'
*/
const clearForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clear.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionImportController::clear
* @see app/Http/Controllers/TransactionImportController.php:65
* @route '/api/transactions/import/clear'
*/
clearForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clear.url(options),
    method: 'post',
})

clear.form = clearForm

const TransactionImportController = { importMethod, statistics, clear, import: importMethod }

export default TransactionImportController