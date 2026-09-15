import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
const Controller980bb49ee7ae63891f1d891d2fbcf1c9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

Controller980bb49ee7ae63891f1d891d2fbcf1c9.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
Controller980bb49ee7ae63891f1d891d2fbcf1c9.url = (options?: RouteQueryOptions) => {
    return Controller980bb49ee7ae63891f1d891d2fbcf1c9.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
Controller980bb49ee7ae63891f1d891d2fbcf1c9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
Controller980bb49ee7ae63891f1d891d2fbcf1c9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
const Controller980bb49ee7ae63891f1d891d2fbcf1c9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
Controller980bb49ee7ae63891f1d891d2fbcf1c9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
Controller980bb49ee7ae63891f1d891d2fbcf1c9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller980bb49ee7ae63891f1d891d2fbcf1c9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller980bb49ee7ae63891f1d891d2fbcf1c9.form = Controller980bb49ee7ae63891f1d891d2fbcf1c9Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
const Controller42a740574ecbfbac32f8cc353fc32db9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})

Controller42a740574ecbfbac32f8cc353fc32db9.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
Controller42a740574ecbfbac32f8cc353fc32db9.url = (options?: RouteQueryOptions) => {
    return Controller42a740574ecbfbac32f8cc353fc32db9.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
Controller42a740574ecbfbac32f8cc353fc32db9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
Controller42a740574ecbfbac32f8cc353fc32db9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
const Controller42a740574ecbfbac32f8cc353fc32db9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
Controller42a740574ecbfbac32f8cc353fc32db9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
Controller42a740574ecbfbac32f8cc353fc32db9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller42a740574ecbfbac32f8cc353fc32db9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller42a740574ecbfbac32f8cc353fc32db9.form = Controller42a740574ecbfbac32f8cc353fc32db9Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
const Controller577f898b9efe99e2813f63fd231bd8c7 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller577f898b9efe99e2813f63fd231bd8c7.url(options),
    method: 'get',
})

Controller577f898b9efe99e2813f63fd231bd8c7.definition = {
    methods: ["get","head"],
    url: '/accounts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
Controller577f898b9efe99e2813f63fd231bd8c7.url = (options?: RouteQueryOptions) => {
    return Controller577f898b9efe99e2813f63fd231bd8c7.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
Controller577f898b9efe99e2813f63fd231bd8c7.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller577f898b9efe99e2813f63fd231bd8c7.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
Controller577f898b9efe99e2813f63fd231bd8c7.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller577f898b9efe99e2813f63fd231bd8c7.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
const Controller577f898b9efe99e2813f63fd231bd8c7Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller577f898b9efe99e2813f63fd231bd8c7.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
Controller577f898b9efe99e2813f63fd231bd8c7Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller577f898b9efe99e2813f63fd231bd8c7.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/accounts'
*/
Controller577f898b9efe99e2813f63fd231bd8c7Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller577f898b9efe99e2813f63fd231bd8c7.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller577f898b9efe99e2813f63fd231bd8c7.form = Controller577f898b9efe99e2813f63fd231bd8c7Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
const Controller5fbe311172c80aea24e168c1390225a1 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller5fbe311172c80aea24e168c1390225a1.url(options),
    method: 'get',
})

Controller5fbe311172c80aea24e168c1390225a1.definition = {
    methods: ["get","head"],
    url: '/reconciliation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
Controller5fbe311172c80aea24e168c1390225a1.url = (options?: RouteQueryOptions) => {
    return Controller5fbe311172c80aea24e168c1390225a1.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
Controller5fbe311172c80aea24e168c1390225a1.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller5fbe311172c80aea24e168c1390225a1.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
Controller5fbe311172c80aea24e168c1390225a1.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller5fbe311172c80aea24e168c1390225a1.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
const Controller5fbe311172c80aea24e168c1390225a1Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller5fbe311172c80aea24e168c1390225a1.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
Controller5fbe311172c80aea24e168c1390225a1Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller5fbe311172c80aea24e168c1390225a1.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/reconciliation'
*/
Controller5fbe311172c80aea24e168c1390225a1Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller5fbe311172c80aea24e168c1390225a1.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller5fbe311172c80aea24e168c1390225a1.form = Controller5fbe311172c80aea24e168c1390225a1Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
const Controller7a4f8d9d0be39757f6a1352cf8f1ab45 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url(options),
    method: 'get',
})

Controller7a4f8d9d0be39757f6a1352cf8f1ab45.definition = {
    methods: ["get","head"],
    url: '/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url = (options?: RouteQueryOptions) => {
    return Controller7a4f8d9d0be39757f6a1352cf8f1ab45.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
Controller7a4f8d9d0be39757f6a1352cf8f1ab45.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
Controller7a4f8d9d0be39757f6a1352cf8f1ab45.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
const Controller7a4f8d9d0be39757f6a1352cf8f1ab45Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
Controller7a4f8d9d0be39757f6a1352cf8f1ab45Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/categories'
*/
Controller7a4f8d9d0be39757f6a1352cf8f1ab45Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller7a4f8d9d0be39757f6a1352cf8f1ab45.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller7a4f8d9d0be39757f6a1352cf8f1ab45.form = Controller7a4f8d9d0be39757f6a1352cf8f1ab45Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
const Controllere5aa2cad321b30063c3b415df5452200 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})

Controllere5aa2cad321b30063c3b415df5452200.definition = {
    methods: ["get","head"],
    url: '/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
Controllere5aa2cad321b30063c3b415df5452200.url = (options?: RouteQueryOptions) => {
    return Controllere5aa2cad321b30063c3b415df5452200.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
Controllere5aa2cad321b30063c3b415df5452200.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
Controllere5aa2cad321b30063c3b415df5452200.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllere5aa2cad321b30063c3b415df5452200.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
const Controllere5aa2cad321b30063c3b415df5452200Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
Controllere5aa2cad321b30063c3b415df5452200Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere5aa2cad321b30063c3b415df5452200.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/transactions'
*/
Controllere5aa2cad321b30063c3b415df5452200Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere5aa2cad321b30063c3b415df5452200.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllere5aa2cad321b30063c3b415df5452200.form = Controllere5aa2cad321b30063c3b415df5452200Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
const Controller319c434a45921953484cb2f345f6ad0c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller319c434a45921953484cb2f345f6ad0c.url(options),
    method: 'get',
})

Controller319c434a45921953484cb2f345f6ad0c.definition = {
    methods: ["get","head"],
    url: '/import',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
Controller319c434a45921953484cb2f345f6ad0c.url = (options?: RouteQueryOptions) => {
    return Controller319c434a45921953484cb2f345f6ad0c.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
Controller319c434a45921953484cb2f345f6ad0c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller319c434a45921953484cb2f345f6ad0c.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
Controller319c434a45921953484cb2f345f6ad0c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller319c434a45921953484cb2f345f6ad0c.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
const Controller319c434a45921953484cb2f345f6ad0cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller319c434a45921953484cb2f345f6ad0c.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
Controller319c434a45921953484cb2f345f6ad0cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller319c434a45921953484cb2f345f6ad0c.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/import'
*/
Controller319c434a45921953484cb2f345f6ad0cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller319c434a45921953484cb2f345f6ad0c.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller319c434a45921953484cb2f345f6ad0c.form = Controller319c434a45921953484cb2f345f6ad0cForm
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
const Controllere19ee86e9cf603ce1a59a1ec5d21dec5 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url(options),
    method: 'get',
})

Controllere19ee86e9cf603ce1a59a1ec5d21dec5.definition = {
    methods: ["get","head"],
    url: '/settings/appearance',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url = (options?: RouteQueryOptions) => {
    return Controllere19ee86e9cf603ce1a59a1ec5d21dec5.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
Controllere19ee86e9cf603ce1a59a1ec5d21dec5.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
Controllere19ee86e9cf603ce1a59a1ec5d21dec5.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
const Controllere19ee86e9cf603ce1a59a1ec5d21dec5Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
Controllere19ee86e9cf603ce1a59a1ec5d21dec5Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/appearance'
*/
Controllere19ee86e9cf603ce1a59a1ec5d21dec5Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllere19ee86e9cf603ce1a59a1ec5d21dec5.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllere19ee86e9cf603ce1a59a1ec5d21dec5.form = Controllere19ee86e9cf603ce1a59a1ec5d21dec5Form

/**
* Multiple routes resolve to \Inertia\Controller::Controller, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `Controller['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
const Controller = {
    '/': Controller980bb49ee7ae63891f1d891d2fbcf1c9,
    '/dashboard': Controller42a740574ecbfbac32f8cc353fc32db9,
    '/accounts': Controller577f898b9efe99e2813f63fd231bd8c7,
    '/reconciliation': Controller5fbe311172c80aea24e168c1390225a1,
    '/categories': Controller7a4f8d9d0be39757f6a1352cf8f1ab45,
    '/transactions': Controllere5aa2cad321b30063c3b415df5452200,
    '/import': Controller319c434a45921953484cb2f345f6ad0c,
    '/settings/appearance': Controllere19ee86e9cf603ce1a59a1ec5d21dec5,
}

export default Controller