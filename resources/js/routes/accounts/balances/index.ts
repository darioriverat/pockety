import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
export const index = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/accounts/{accountId}/balances',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
index.url = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { accountId: args }
    }

    if (Array.isArray(args)) {
        args = {
            accountId: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        accountId: args.accountId,
    }

    return index.definition.url
            .replace('{accountId}', parsedArgs.accountId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
index.get = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
index.head = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
const indexForm = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
indexForm.get = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::index
* @see app/Http/Controllers/AccountBalanceController.php:19
* @route '/api/accounts/{accountId}/balances'
*/
indexForm.head = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\AccountBalanceController::store
* @see app/Http/Controllers/AccountBalanceController.php:65
* @route '/api/accounts/{accountId}/balances'
*/
export const store = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/accounts/{accountId}/balances',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountBalanceController::store
* @see app/Http/Controllers/AccountBalanceController.php:65
* @route '/api/accounts/{accountId}/balances'
*/
store.url = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { accountId: args }
    }

    if (Array.isArray(args)) {
        args = {
            accountId: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        accountId: args.accountId,
    }

    return store.definition.url
            .replace('{accountId}', parsedArgs.accountId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceController::store
* @see app/Http/Controllers/AccountBalanceController.php:65
* @route '/api/accounts/{accountId}/balances'
*/
store.post = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::store
* @see app/Http/Controllers/AccountBalanceController.php:65
* @route '/api/accounts/{accountId}/balances'
*/
const storeForm = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::store
* @see app/Http/Controllers/AccountBalanceController.php:65
* @route '/api/accounts/{accountId}/balances'
*/
storeForm.post = (args: { accountId: string | number } | [accountId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
export const show = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/accounts/{accountId}/balances/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
show.url = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            accountId: args[0],
            id: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        accountId: args.accountId,
        id: args.id,
    }

    return show.definition.url
            .replace('{accountId}', parsedArgs.accountId.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
show.get = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
show.head = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
const showForm = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
showForm.get = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::show
* @see app/Http/Controllers/AccountBalanceController.php:131
* @route '/api/accounts/{accountId}/balances/{id}'
*/
showForm.head = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\AccountBalanceController::destroy
* @see app/Http/Controllers/AccountBalanceController.php:165
* @route '/api/accounts/{accountId}/balances/{id}'
*/
export const destroy = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/accounts/{accountId}/balances/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AccountBalanceController::destroy
* @see app/Http/Controllers/AccountBalanceController.php:165
* @route '/api/accounts/{accountId}/balances/{id}'
*/
destroy.url = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            accountId: args[0],
            id: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        accountId: args.accountId,
        id: args.id,
    }

    return destroy.definition.url
            .replace('{accountId}', parsedArgs.accountId.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceController::destroy
* @see app/Http/Controllers/AccountBalanceController.php:165
* @route '/api/accounts/{accountId}/balances/{id}'
*/
destroy.delete = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::destroy
* @see app/Http/Controllers/AccountBalanceController.php:165
* @route '/api/accounts/{accountId}/balances/{id}'
*/
const destroyForm = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountBalanceController::destroy
* @see app/Http/Controllers/AccountBalanceController.php:165
* @route '/api/accounts/{accountId}/balances/{id}'
*/
destroyForm.delete = (args: { accountId: string | number, id: string | number } | [accountId: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm
