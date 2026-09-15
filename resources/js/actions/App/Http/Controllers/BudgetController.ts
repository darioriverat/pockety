import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/budgets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::index
* @see app/Http/Controllers/BudgetController.php:20
* @route '/api/budgets'
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

/**
* @see \App\Http\Controllers\BudgetController::store
* @see app/Http/Controllers/BudgetController.php:48
* @route '/api/budgets'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/budgets',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BudgetController::store
* @see app/Http/Controllers/BudgetController.php:48
* @route '/api/budgets'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BudgetController::store
* @see app/Http/Controllers/BudgetController.php:48
* @route '/api/budgets'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BudgetController::store
* @see app/Http/Controllers/BudgetController.php:48
* @route '/api/budgets'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BudgetController::store
* @see app/Http/Controllers/BudgetController.php:48
* @route '/api/budgets'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
export const report = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(options),
    method: 'get',
})

report.definition = {
    methods: ["get","head"],
    url: '/api/budgets/report',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
report.url = (options?: RouteQueryOptions) => {
    return report.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
report.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
report.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: report.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
const reportForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
reportForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::report
* @see app/Http/Controllers/BudgetController.php:96
* @route '/api/budgets/report'
*/
reportForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

report.form = reportForm

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
export const exportReport = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportReport.url(options),
    method: 'get',
})

exportReport.definition = {
    methods: ["get","head"],
    url: '/api/budgets/report/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
exportReport.url = (options?: RouteQueryOptions) => {
    return exportReport.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
exportReport.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportReport.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
exportReport.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportReport.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
const exportReportForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReport.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
exportReportForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReport.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportReport
* @see app/Http/Controllers/BudgetController.php:124
* @route '/api/budgets/report/export'
*/
exportReportForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReport.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportReport.form = exportReportForm

const BudgetController = { index, store, report, exportReport }

export default BudgetController