import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/preferences',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PreferencesController::index
* @see app/Http/Controllers/PreferencesController.php:15
* @route '/preferences'
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
* @see \App\Http\Controllers\PreferencesController::update
* @see app/Http/Controllers/PreferencesController.php:27
* @route '/preferences'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/preferences',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PreferencesController::update
* @see app/Http/Controllers/PreferencesController.php:27
* @route '/preferences'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PreferencesController::update
* @see app/Http/Controllers/PreferencesController.php:27
* @route '/preferences'
*/
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PreferencesController::update
* @see app/Http/Controllers/PreferencesController.php:27
* @route '/preferences'
*/
const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PreferencesController::update
* @see app/Http/Controllers/PreferencesController.php:27
* @route '/preferences'
*/
updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(options),
    method: 'post',
})

update.form = updateForm

const PreferencesController = { index, update }

export default PreferencesController