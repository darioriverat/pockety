import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
export const yearToDate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: yearToDate.url(options),
    method: 'get',
})

yearToDate.definition = {
    methods: ["get","head"],
    url: '/reports/year-to-date',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
yearToDate.url = (options?: RouteQueryOptions) => {
    return yearToDate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
yearToDate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: yearToDate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
yearToDate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: yearToDate.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
const yearToDateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: yearToDate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
yearToDateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: yearToDate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::yearToDate
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
yearToDateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: yearToDate.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

yearToDate.form = yearToDateForm

const ReportsController = { yearToDate }

export default ReportsController