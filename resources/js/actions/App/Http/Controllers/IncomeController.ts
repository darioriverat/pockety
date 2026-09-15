import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/income',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::index
* @see app/Http/Controllers/IncomeController.php:23
* @route '/api/income'
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
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/income/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
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
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\IncomeController::show
* @see app/Http/Controllers/IncomeController.php:55
* @route '/api/income/{id}'
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
* @see \App\Http\Controllers\IncomeController::store
* @see app/Http/Controllers/IncomeController.php:79
* @route '/api/income'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/income',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\IncomeController::store
* @see app/Http/Controllers/IncomeController.php:79
* @route '/api/income'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\IncomeController::store
* @see app/Http/Controllers/IncomeController.php:79
* @route '/api/income'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\IncomeController::store
* @see app/Http/Controllers/IncomeController.php:79
* @route '/api/income'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\IncomeController::store
* @see app/Http/Controllers/IncomeController.php:79
* @route '/api/income'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
const update43b96a1523f720a03e7b37f5e2c608bd = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update43b96a1523f720a03e7b37f5e2c608bd.url(args, options),
    method: 'put',
})

update43b96a1523f720a03e7b37f5e2c608bd.definition = {
    methods: ["put"],
    url: '/api/income/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bd.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update43b96a1523f720a03e7b37f5e2c608bd.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bd.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update43b96a1523f720a03e7b37f5e2c608bd.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
const update43b96a1523f720a03e7b37f5e2c608bdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update43b96a1523f720a03e7b37f5e2c608bd.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bdForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update43b96a1523f720a03e7b37f5e2c608bd.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update43b96a1523f720a03e7b37f5e2c608bd.form = update43b96a1523f720a03e7b37f5e2c608bdForm
/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
const update43b96a1523f720a03e7b37f5e2c608bd = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update43b96a1523f720a03e7b37f5e2c608bd.url(args, options),
    method: 'patch',
})

update43b96a1523f720a03e7b37f5e2c608bd.definition = {
    methods: ["patch"],
    url: '/api/income/{id}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bd.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update43b96a1523f720a03e7b37f5e2c608bd.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bd.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update43b96a1523f720a03e7b37f5e2c608bd.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
const update43b96a1523f720a03e7b37f5e2c608bdForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update43b96a1523f720a03e7b37f5e2c608bd.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\IncomeController::update
* @see app/Http/Controllers/IncomeController.php:117
* @route '/api/income/{id}'
*/
update43b96a1523f720a03e7b37f5e2c608bdForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update43b96a1523f720a03e7b37f5e2c608bd.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update43b96a1523f720a03e7b37f5e2c608bd.form = update43b96a1523f720a03e7b37f5e2c608bdForm

/**
* Multiple routes resolve to \App\Http\Controllers\IncomeController::update, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `update['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const update = {
    '/api/income/{id}': update43b96a1523f720a03e7b37f5e2c608bd,
    '/api/income/{id}': update43b96a1523f720a03e7b37f5e2c608bd,
}

/**
* @see \App\Http\Controllers\IncomeController::destroy
* @see app/Http/Controllers/IncomeController.php:158
* @route '/api/income/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/income/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\IncomeController::destroy
* @see app/Http/Controllers/IncomeController.php:158
* @route '/api/income/{id}'
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
* @see \App\Http\Controllers\IncomeController::destroy
* @see app/Http/Controllers/IncomeController.php:158
* @route '/api/income/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\IncomeController::destroy
* @see app/Http/Controllers/IncomeController.php:158
* @route '/api/income/{id}'
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
* @see \App\Http\Controllers\IncomeController::destroy
* @see app/Http/Controllers/IncomeController.php:158
* @route '/api/income/{id}'
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

const IncomeController = { index, show, store, update, destroy }

export default IncomeController