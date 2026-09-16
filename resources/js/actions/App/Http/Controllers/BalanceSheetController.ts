import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
const show688205cb9ed2bfe8eb7a66220b56904a = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show688205cb9ed2bfe8eb7a66220b56904a.url(options),
    method: 'get',
})

show688205cb9ed2bfe8eb7a66220b56904a.definition = {
    methods: ["get","head"],
    url: '/api/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show688205cb9ed2bfe8eb7a66220b56904a.url = (options?: RouteQueryOptions) => {
    return show688205cb9ed2bfe8eb7a66220b56904a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show688205cb9ed2bfe8eb7a66220b56904a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show688205cb9ed2bfe8eb7a66220b56904a.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show688205cb9ed2bfe8eb7a66220b56904a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show688205cb9ed2bfe8eb7a66220b56904a.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
const show688205cb9ed2bfe8eb7a66220b56904aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show688205cb9ed2bfe8eb7a66220b56904a.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show688205cb9ed2bfe8eb7a66220b56904aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show688205cb9ed2bfe8eb7a66220b56904a.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/balance-sheet'
*/
show688205cb9ed2bfe8eb7a66220b56904aForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show688205cb9ed2bfe8eb7a66220b56904a.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show688205cb9ed2bfe8eb7a66220b56904a.form = show688205cb9ed2bfe8eb7a66220b56904aForm
/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
const showc3d49280f6404ff3832c85f88e3620fc = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showc3d49280f6404ff3832c85f88e3620fc.url(args, options),
    method: 'get',
})

showc3d49280f6404ff3832c85f88e3620fc.definition = {
    methods: ["get","head"],
    url: '/api/periods/{period}/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
showc3d49280f6404ff3832c85f88e3620fc.url = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { period: args }
    }

    if (Array.isArray(args)) {
        args = {
            period: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        period: args.period,
    }

    return showc3d49280f6404ff3832c85f88e3620fc.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
showc3d49280f6404ff3832c85f88e3620fc.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showc3d49280f6404ff3832c85f88e3620fc.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
showc3d49280f6404ff3832c85f88e3620fc.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showc3d49280f6404ff3832c85f88e3620fc.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
const showc3d49280f6404ff3832c85f88e3620fcForm = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showc3d49280f6404ff3832c85f88e3620fc.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
showc3d49280f6404ff3832c85f88e3620fcForm.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showc3d49280f6404ff3832c85f88e3620fc.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BalanceSheetController::show
* @see app/Http/Controllers/BalanceSheetController.php:24
* @route '/api/periods/{period}/balance-sheet'
*/
showc3d49280f6404ff3832c85f88e3620fcForm.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showc3d49280f6404ff3832c85f88e3620fc.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

showc3d49280f6404ff3832c85f88e3620fc.form = showc3d49280f6404ff3832c85f88e3620fcForm

/**
* Multiple routes resolve to \App\Http\Controllers\BalanceSheetController::show, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `show['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const show = {
    '/api/balance-sheet': show688205cb9ed2bfe8eb7a66220b56904a,
    '/api/periods/{period}/balance-sheet': showc3d49280f6404ff3832c85f88e3620fc,
}

const BalanceSheetController = { timeSeries, exportPdf, show }

export default BalanceSheetController