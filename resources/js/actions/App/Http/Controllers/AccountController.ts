import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/accounts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::index
* @see app/Http/Controllers/AccountController.php:26
* @route '/api/accounts'
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
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/accounts/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::show
* @see app/Http/Controllers/AccountController.php:62
* @route '/api/accounts/{id}'
*/
showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
export const transactions = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transactions.url(args, options),
    method: 'get',
})

transactions.definition = {
    methods: ["get","head"],
    url: '/api/accounts/{id}/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
transactions.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return transactions.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
transactions.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transactions.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
transactions.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: transactions.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
const transactionsForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
transactionsForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AccountController::transactions
* @see app/Http/Controllers/AccountController.php:200
* @route '/api/accounts/{id}/transactions'
*/
transactionsForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

transactions.form = transactionsForm

/**
* @see \App\Http\Controllers\AccountController::store
* @see app/Http/Controllers/AccountController.php:86
* @route '/api/accounts'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/accounts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountController::store
* @see app/Http/Controllers/AccountController.php:86
* @route '/api/accounts'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::store
* @see app/Http/Controllers/AccountController.php:86
* @route '/api/accounts'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountController::store
* @see app/Http/Controllers/AccountController.php:86
* @route '/api/accounts'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountController::store
* @see app/Http/Controllers/AccountController.php:86
* @route '/api/accounts'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
const updated894e4fc412cb6b91ba023f99ce05822 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updated894e4fc412cb6b91ba023f99ce05822.url(args, options),
    method: 'put',
})

updated894e4fc412cb6b91ba023f99ce05822.definition = {
    methods: ["put"],
    url: '/api/accounts/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return updated894e4fc412cb6b91ba023f99ce05822.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updated894e4fc412cb6b91ba023f99ce05822.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
const updated894e4fc412cb6b91ba023f99ce05822Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updated894e4fc412cb6b91ba023f99ce05822.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822Form.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updated894e4fc412cb6b91ba023f99ce05822.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updated894e4fc412cb6b91ba023f99ce05822.form = updated894e4fc412cb6b91ba023f99ce05822Form
/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
const updated894e4fc412cb6b91ba023f99ce05822 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updated894e4fc412cb6b91ba023f99ce05822.url(args, options),
    method: 'patch',
})

updated894e4fc412cb6b91ba023f99ce05822.definition = {
    methods: ["patch"],
    url: '/api/accounts/{id}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return updated894e4fc412cb6b91ba023f99ce05822.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updated894e4fc412cb6b91ba023f99ce05822.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
const updated894e4fc412cb6b91ba023f99ce05822Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updated894e4fc412cb6b91ba023f99ce05822.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountController::update
* @see app/Http/Controllers/AccountController.php:123
* @route '/api/accounts/{id}'
*/
updated894e4fc412cb6b91ba023f99ce05822Form.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updated894e4fc412cb6b91ba023f99ce05822.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updated894e4fc412cb6b91ba023f99ce05822.form = updated894e4fc412cb6b91ba023f99ce05822Form

/**
* Multiple routes resolve to \App\Http\Controllers\AccountController::update, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `update['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const update = {
    '/api/accounts/{id}': updated894e4fc412cb6b91ba023f99ce05822,
    '/api/accounts/{id}': updated894e4fc412cb6b91ba023f99ce05822,
}

/**
* @see \App\Http\Controllers\AccountController::destroy
* @see app/Http/Controllers/AccountController.php:165
* @route '/api/accounts/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/accounts/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AccountController::destroy
* @see app/Http/Controllers/AccountController.php:165
* @route '/api/accounts/{id}'
*/
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::destroy
* @see app/Http/Controllers/AccountController.php:165
* @route '/api/accounts/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AccountController::destroy
* @see app/Http/Controllers/AccountController.php:165
* @route '/api/accounts/{id}'
*/
const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AccountController::destroy
* @see app/Http/Controllers/AccountController.php:165
* @route '/api/accounts/{id}'
*/
destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const AccountController = { index, show, transactions, store, update, destroy }

export default AccountController