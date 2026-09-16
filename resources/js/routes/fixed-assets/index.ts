import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/fixed-assets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::index
* @see app/Http/Controllers/FixedAssetController.php:17
* @route '/api/fixed-assets'
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
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/fixed-assets/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
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
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::show
* @see app/Http/Controllers/FixedAssetController.php:50
* @route '/api/fixed-assets/{id}'
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
* @see \App\Http\Controllers\FixedAssetController::store
* @see app/Http/Controllers/FixedAssetController.php:83
* @route '/api/fixed-assets'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/fixed-assets',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FixedAssetController::store
* @see app/Http/Controllers/FixedAssetController.php:83
* @route '/api/fixed-assets'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FixedAssetController::store
* @see app/Http/Controllers/FixedAssetController.php:83
* @route '/api/fixed-assets'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FixedAssetController::store
* @see app/Http/Controllers/FixedAssetController.php:83
* @route '/api/fixed-assets'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FixedAssetController::store
* @see app/Http/Controllers/FixedAssetController.php:83
* @route '/api/fixed-assets'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/api/fixed-assets/{id}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
update.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FixedAssetController::update
* @see app/Http/Controllers/FixedAssetController.php:117
* @route '/api/fixed-assets/{id}'
*/
updateForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\FixedAssetController::destroy
* @see app/Http/Controllers/FixedAssetController.php:160
* @route '/api/fixed-assets/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/fixed-assets/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\FixedAssetController::destroy
* @see app/Http/Controllers/FixedAssetController.php:160
* @route '/api/fixed-assets/{id}'
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
* @see \App\Http\Controllers\FixedAssetController::destroy
* @see app/Http/Controllers/FixedAssetController.php:160
* @route '/api/fixed-assets/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\FixedAssetController::destroy
* @see app/Http/Controllers/FixedAssetController.php:160
* @route '/api/fixed-assets/{id}'
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
* @see \App\Http\Controllers\FixedAssetController::destroy
* @see app/Http/Controllers/FixedAssetController.php:160
* @route '/api/fixed-assets/{id}'
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

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
export const valuations = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: valuations.url(args, options),
    method: 'get',
})

valuations.definition = {
    methods: ["get","head"],
    url: '/api/fixed-assets/{id}/valuations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
valuations.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return valuations.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
valuations.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: valuations.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
valuations.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: valuations.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
const valuationsForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: valuations.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
valuationsForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: valuations.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FixedAssetController::valuations
* @see app/Http/Controllers/FixedAssetController.php:182
* @route '/api/fixed-assets/{id}/valuations'
*/
valuationsForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: valuations.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

valuations.form = valuationsForm
