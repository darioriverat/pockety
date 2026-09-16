import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::index
* @see app/Http/Controllers/TransactionController.php:27
* @route '/api/transactions'
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
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/transactions/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
*/
exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::exportMethod
* @see app/Http/Controllers/TransactionController.php:329
* @route '/api/transactions/export'
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

/**
* @see \App\Http\Controllers\TransactionController::bulkUpdate
* @see app/Http/Controllers/TransactionController.php:220
* @route '/api/transactions/bulk'
*/
export const bulkUpdate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkUpdate.url(options),
    method: 'post',
})

bulkUpdate.definition = {
    methods: ["post"],
    url: '/api/transactions/bulk',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TransactionController::bulkUpdate
* @see app/Http/Controllers/TransactionController.php:220
* @route '/api/transactions/bulk'
*/
bulkUpdate.url = (options?: RouteQueryOptions) => {
    return bulkUpdate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::bulkUpdate
* @see app/Http/Controllers/TransactionController.php:220
* @route '/api/transactions/bulk'
*/
bulkUpdate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkUpdate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::bulkUpdate
* @see app/Http/Controllers/TransactionController.php:220
* @route '/api/transactions/bulk'
*/
const bulkUpdateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkUpdate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::bulkUpdate
* @see app/Http/Controllers/TransactionController.php:220
* @route '/api/transactions/bulk'
*/
bulkUpdateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkUpdate.url(options),
    method: 'post',
})

bulkUpdate.form = bulkUpdateForm

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/transactions/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
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
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TransactionController::show
* @see app/Http/Controllers/TransactionController.php:90
* @route '/api/transactions/{id}'
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
* @see \App\Http\Controllers\TransactionController::duplicate
* @see app/Http/Controllers/TransactionController.php:264
* @route '/api/transactions/{id}/duplicate'
*/
export const duplicate = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

duplicate.definition = {
    methods: ["post"],
    url: '/api/transactions/{id}/duplicate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TransactionController::duplicate
* @see app/Http/Controllers/TransactionController.php:264
* @route '/api/transactions/{id}/duplicate'
*/
duplicate.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return duplicate.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::duplicate
* @see app/Http/Controllers/TransactionController.php:264
* @route '/api/transactions/{id}/duplicate'
*/
duplicate.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::duplicate
* @see app/Http/Controllers/TransactionController.php:264
* @route '/api/transactions/{id}/duplicate'
*/
const duplicateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: duplicate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::duplicate
* @see app/Http/Controllers/TransactionController.php:264
* @route '/api/transactions/{id}/duplicate'
*/
duplicateForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: duplicate.url(args, options),
    method: 'post',
})

duplicate.form = duplicateForm

/**
* @see \App\Http\Controllers\TransactionController::store
* @see app/Http/Controllers/TransactionController.php:114
* @route '/api/transactions'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/transactions',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TransactionController::store
* @see app/Http/Controllers/TransactionController.php:114
* @route '/api/transactions'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::store
* @see app/Http/Controllers/TransactionController.php:114
* @route '/api/transactions'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::store
* @see app/Http/Controllers/TransactionController.php:114
* @route '/api/transactions'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::store
* @see app/Http/Controllers/TransactionController.php:114
* @route '/api/transactions'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
const updatedd096f5c5ca87c3e8674653cca06fefe = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, options),
    method: 'put',
})

updatedd096f5c5ca87c3e8674653cca06fefe.definition = {
    methods: ["put"],
    url: '/api/transactions/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefe.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updatedd096f5c5ca87c3e8674653cca06fefe.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefe.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
const updatedd096f5c5ca87c3e8674653cca06fefeForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefeForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updatedd096f5c5ca87c3e8674653cca06fefe.form = updatedd096f5c5ca87c3e8674653cca06fefeForm
/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
const updatedd096f5c5ca87c3e8674653cca06fefe = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, options),
    method: 'patch',
})

updatedd096f5c5ca87c3e8674653cca06fefe.definition = {
    methods: ["patch"],
    url: '/api/transactions/{id}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefe.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updatedd096f5c5ca87c3e8674653cca06fefe.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefe.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
const updatedd096f5c5ca87c3e8674653cca06fefeForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TransactionController::update
* @see app/Http/Controllers/TransactionController.php:165
* @route '/api/transactions/{id}'
*/
updatedd096f5c5ca87c3e8674653cca06fefeForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatedd096f5c5ca87c3e8674653cca06fefe.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updatedd096f5c5ca87c3e8674653cca06fefe.form = updatedd096f5c5ca87c3e8674653cca06fefeForm

/**
* Multiple routes resolve to \App\Http\Controllers\TransactionController::update, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `update['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const update = {
    '/api/transactions/{id}': updatedd096f5c5ca87c3e8674653cca06fefe,
    '/api/transactions/{id}': updatedd096f5c5ca87c3e8674653cca06fefe,
}

/**
* @see \App\Http\Controllers\TransactionController::destroy
* @see app/Http/Controllers/TransactionController.php:307
* @route '/api/transactions/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/transactions/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TransactionController::destroy
* @see app/Http/Controllers/TransactionController.php:307
* @route '/api/transactions/{id}'
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
* @see \App\Http\Controllers\TransactionController::destroy
* @see app/Http/Controllers/TransactionController.php:307
* @route '/api/transactions/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\TransactionController::destroy
* @see app/Http/Controllers/TransactionController.php:307
* @route '/api/transactions/{id}'
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
* @see \App\Http\Controllers\TransactionController::destroy
* @see app/Http/Controllers/TransactionController.php:307
* @route '/api/transactions/{id}'
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

const TransactionController = { index, exportMethod, bulkUpdate, show, duplicate, store, update, destroy, export: exportMethod }

export default TransactionController