import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
export const ytd = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ytd.url(options),
    method: 'get',
})

ytd.definition = {
    methods: ["get","head"],
    url: '/reports/year-to-date',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
ytd.url = (options?: RouteQueryOptions) => {
    return ytd.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
ytd.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ytd.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
ytd.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ytd.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
const ytdForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ytd.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
ytdForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ytd.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReportsController::ytd
* @see app/Http/Controllers/ReportsController.php:19
* @route '/reports/year-to-date'
*/
ytdForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ytd.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ytd.form = ytdForm

const reports = {
    ytd: Object.assign(ytd, ytd),
}

export default reports