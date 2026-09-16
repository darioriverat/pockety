import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/api/financial-summary/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::exportPdf
* @see app/Http/Controllers/FinancialSummaryController.php:63
* @route '/api/financial-summary/export'
*/
exportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportPdf.form = exportPdfForm

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/financial-summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FinancialSummaryController::show
* @see app/Http/Controllers/FinancialSummaryController.php:24
* @route '/api/financial-summary'
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
