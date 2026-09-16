import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
export const show = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/periods/{period}/reconciliation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
show.url = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
show.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
show.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
const showForm = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
showForm.get = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ReconciliationController::show
* @see app/Http/Controllers/ReconciliationController.php:22
* @route '/api/periods/{period}/reconciliation'
*/
showForm.head = (args: { period: string | number } | [period: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\ReconciliationController::acknowledge
* @see app/Http/Controllers/ReconciliationController.php:54
* @route '/api/periods/{period}/reconciliation/{accountId}/acknowledge'
*/
export const acknowledge = (args: { period: string | number, accountId: string | number } | [period: string | number, accountId: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acknowledge.url(args, options),
    method: 'post',
})

acknowledge.definition = {
    methods: ["post"],
    url: '/api/periods/{period}/reconciliation/{accountId}/acknowledge',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReconciliationController::acknowledge
* @see app/Http/Controllers/ReconciliationController.php:54
* @route '/api/periods/{period}/reconciliation/{accountId}/acknowledge'
*/
acknowledge.url = (args: { period: string | number, accountId: string | number } | [period: string | number, accountId: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            period: args[0],
            accountId: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        period: args.period,
        accountId: args.accountId,
    }

    return acknowledge.definition.url
            .replace('{period}', parsedArgs.period.toString())
            .replace('{accountId}', parsedArgs.accountId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReconciliationController::acknowledge
* @see app/Http/Controllers/ReconciliationController.php:54
* @route '/api/periods/{period}/reconciliation/{accountId}/acknowledge'
*/
acknowledge.post = (args: { period: string | number, accountId: string | number } | [period: string | number, accountId: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: acknowledge.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReconciliationController::acknowledge
* @see app/Http/Controllers/ReconciliationController.php:54
* @route '/api/periods/{period}/reconciliation/{accountId}/acknowledge'
*/
const acknowledgeForm = (args: { period: string | number, accountId: string | number } | [period: string | number, accountId: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: acknowledge.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReconciliationController::acknowledge
* @see app/Http/Controllers/ReconciliationController.php:54
* @route '/api/periods/{period}/reconciliation/{accountId}/acknowledge'
*/
acknowledgeForm.post = (args: { period: string | number, accountId: string | number } | [period: string | number, accountId: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: acknowledge.url(args, options),
    method: 'post',
})

acknowledge.form = acknowledgeForm

const ReconciliationController = { show, acknowledge }

export default ReconciliationController