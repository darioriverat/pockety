import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/budgets/report/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BudgetController::exportMethod
* @see app/Http/Controllers/BudgetController.php:122
* @route '/api/budgets/report/export'
*/
exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportMethod.form = exportMethodForm
