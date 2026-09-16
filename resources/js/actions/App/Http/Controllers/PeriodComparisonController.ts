import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/periods/compare',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PeriodComparisonController::show
* @see app/Http/Controllers/PeriodComparisonController.php:20
* @route '/api/periods/compare'
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

const PeriodComparisonController = { show }

export default PeriodComparisonController