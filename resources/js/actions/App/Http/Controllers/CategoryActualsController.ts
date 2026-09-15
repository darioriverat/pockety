import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/category-actuals',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryActualsController::index
* @see app/Http/Controllers/CategoryActualsController.php:20
* @route '/api/category-actuals'
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

const CategoryActualsController = { index }

export default CategoryActualsController