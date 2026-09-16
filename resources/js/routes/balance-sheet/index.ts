import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
export const timeSeries = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: timeSeries.url(options),
    method: 'get',
})

timeSeries.definition = {
    methods: ["get","head"],
    url: '/api/balance-sheet/time-series',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
timeSeries.url = (options?: RouteQueryOptions) => {
    return timeSeries.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
timeSeries.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: timeSeries.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
timeSeries.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: timeSeries.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
const timeSeriesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: timeSeries.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
timeSeriesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: timeSeries.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::timeSeries
* @see app/Http/Controllers/BalanceSheetController.php:87
* @route '/api/balance-sheet/time-series'
*/
timeSeriesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: timeSeries.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

timeSeries.form = timeSeriesForm

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/api/balance-sheet/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
*/
exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::exportPdf
* @see app/Http/Controllers/BalanceSheetController.php:64
* @route '/api/balance-sheet/export'
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
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
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
* @see \App\Http\Controllers\BalanceSheetImportController::importMethod
* @see app/Http/Controllers/BalanceSheetImportController.php:18
* @route '/api/balance-sheet/import'
*/
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/api/balance-sheet/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BalanceSheetImportController::importMethod
* @see app/Http/Controllers/BalanceSheetImportController.php:18
* @route '/api/balance-sheet/import'
*/
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetImportController::importMethod
* @see app/Http/Controllers/BalanceSheetImportController.php:18
* @route '/api/balance-sheet/import'
*/
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BalanceSheetImportController::importMethod
* @see app/Http/Controllers/BalanceSheetImportController.php:18
* @route '/api/balance-sheet/import'
*/
const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BalanceSheetImportController::importMethod
* @see app/Http/Controllers/BalanceSheetImportController.php:18
* @route '/api/balance-sheet/import'
*/
importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

importMethod.form = importMethodForm
