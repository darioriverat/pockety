import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
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

const reconciliation = {
    acknowledge: Object.assign(acknowledge, acknowledge),
}

export default reconciliation