import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/periods/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodHistoryController::index
* @see app/Http/Controllers/PeriodHistoryController.php:20
* @route '/api/periods/history'
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

const PeriodHistoryController = { index }

export default PeriodHistoryController