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
* @route '/income'
*/
const Controller8697b0142b391538b910a8d7291265c2 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller8697b0142b391538b910a8d7291265c2.url(options),
    method: 'get',
})

Controller8697b0142b391538b910a8d7291265c2.definition = {
    methods: ["get","head"],
    url: '/income',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
Controller8697b0142b391538b910a8d7291265c2.url = (options?: RouteQueryOptions) => {
    return Controller8697b0142b391538b910a8d7291265c2.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
Controller8697b0142b391538b910a8d7291265c2.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller8697b0142b391538b910a8d7291265c2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
Controller8697b0142b391538b910a8d7291265c2.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller8697b0142b391538b910a8d7291265c2.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
const Controller8697b0142b391538b910a8d7291265c2Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller8697b0142b391538b910a8d7291265c2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
Controller8697b0142b391538b910a8d7291265c2Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller8697b0142b391538b910a8d7291265c2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/income'
*/
Controller8697b0142b391538b910a8d7291265c2Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller8697b0142b391538b910a8d7291265c2.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller8697b0142b391538b910a8d7291265c2.form = Controller8697b0142b391538b910a8d7291265c2Form
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
* @route '/exchange-rates'
*/
const Controller9ec6ff571c4d5816f375bbafc9964ac9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller9ec6ff571c4d5816f375bbafc9964ac9.url(options),
    method: 'get',
})

Controller9ec6ff571c4d5816f375bbafc9964ac9.definition = {
    methods: ["get","head"],
    url: '/exchange-rates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
Controller9ec6ff571c4d5816f375bbafc9964ac9.url = (options?: RouteQueryOptions) => {
    return Controller9ec6ff571c4d5816f375bbafc9964ac9.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
Controller9ec6ff571c4d5816f375bbafc9964ac9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller9ec6ff571c4d5816f375bbafc9964ac9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
Controller9ec6ff571c4d5816f375bbafc9964ac9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller9ec6ff571c4d5816f375bbafc9964ac9.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
const Controller9ec6ff571c4d5816f375bbafc9964ac9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller9ec6ff571c4d5816f375bbafc9964ac9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
Controller9ec6ff571c4d5816f375bbafc9964ac9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller9ec6ff571c4d5816f375bbafc9964ac9.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/exchange-rates'
*/
Controller9ec6ff571c4d5816f375bbafc9964ac9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller9ec6ff571c4d5816f375bbafc9964ac9.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller9ec6ff571c4d5816f375bbafc9964ac9.form = Controller9ec6ff571c4d5816f375bbafc9964ac9Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
const Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url(options),
    method: 'get',
})

Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.definition = {
    methods: ["get","head"],
    url: '/budgets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url = (options?: RouteQueryOptions) => {
    return Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
const Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/budgets'
*/
Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2.form = Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
const Controllerf28969a658a3db543064530fa037e4a0 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerf28969a658a3db543064530fa037e4a0.url(options),
    method: 'get',
})

Controllerf28969a658a3db543064530fa037e4a0.definition = {
    methods: ["get","head"],
    url: '/financial-summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
Controllerf28969a658a3db543064530fa037e4a0.url = (options?: RouteQueryOptions) => {
    return Controllerf28969a658a3db543064530fa037e4a0.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
Controllerf28969a658a3db543064530fa037e4a0.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerf28969a658a3db543064530fa037e4a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
Controllerf28969a658a3db543064530fa037e4a0.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllerf28969a658a3db543064530fa037e4a0.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
const Controllerf28969a658a3db543064530fa037e4a0Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerf28969a658a3db543064530fa037e4a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
Controllerf28969a658a3db543064530fa037e4a0Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerf28969a658a3db543064530fa037e4a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/financial-summary'
*/
Controllerf28969a658a3db543064530fa037e4a0Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerf28969a658a3db543064530fa037e4a0.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllerf28969a658a3db543064530fa037e4a0.form = Controllerf28969a658a3db543064530fa037e4a0Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
const Controller2cd4284799517c9d71a5ee276641e546 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller2cd4284799517c9d71a5ee276641e546.url(options),
    method: 'get',
})

Controller2cd4284799517c9d71a5ee276641e546.definition = {
    methods: ["get","head"],
    url: '/balance-sheet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
Controller2cd4284799517c9d71a5ee276641e546.url = (options?: RouteQueryOptions) => {
    return Controller2cd4284799517c9d71a5ee276641e546.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
Controller2cd4284799517c9d71a5ee276641e546.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller2cd4284799517c9d71a5ee276641e546.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
Controller2cd4284799517c9d71a5ee276641e546.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller2cd4284799517c9d71a5ee276641e546.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
const Controller2cd4284799517c9d71a5ee276641e546Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller2cd4284799517c9d71a5ee276641e546.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
Controller2cd4284799517c9d71a5ee276641e546Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller2cd4284799517c9d71a5ee276641e546.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet'
*/
Controller2cd4284799517c9d71a5ee276641e546Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller2cd4284799517c9d71a5ee276641e546.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller2cd4284799517c9d71a5ee276641e546.form = Controller2cd4284799517c9d71a5ee276641e546Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
const Controllerc7faafe80c37793e81ea6a8d0f57649e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerc7faafe80c37793e81ea6a8d0f57649e.url(options),
    method: 'get',
})

Controllerc7faafe80c37793e81ea6a8d0f57649e.definition = {
    methods: ["get","head"],
    url: '/balance-sheet/time-series',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
Controllerc7faafe80c37793e81ea6a8d0f57649e.url = (options?: RouteQueryOptions) => {
    return Controllerc7faafe80c37793e81ea6a8d0f57649e.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
Controllerc7faafe80c37793e81ea6a8d0f57649e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllerc7faafe80c37793e81ea6a8d0f57649e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
Controllerc7faafe80c37793e81ea6a8d0f57649e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllerc7faafe80c37793e81ea6a8d0f57649e.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
const Controllerc7faafe80c37793e81ea6a8d0f57649eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerc7faafe80c37793e81ea6a8d0f57649e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
Controllerc7faafe80c37793e81ea6a8d0f57649eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerc7faafe80c37793e81ea6a8d0f57649e.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/balance-sheet/time-series'
*/
Controllerc7faafe80c37793e81ea6a8d0f57649eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controllerc7faafe80c37793e81ea6a8d0f57649e.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controllerc7faafe80c37793e81ea6a8d0f57649e.form = Controllerc7faafe80c37793e81ea6a8d0f57649eForm
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
const Controller66f8e5b78e1501959ce456384c37e122 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller66f8e5b78e1501959ce456384c37e122.url(options),
    method: 'get',
})

Controller66f8e5b78e1501959ce456384c37e122.definition = {
    methods: ["get","head"],
    url: '/fixed-assets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
Controller66f8e5b78e1501959ce456384c37e122.url = (options?: RouteQueryOptions) => {
    return Controller66f8e5b78e1501959ce456384c37e122.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
Controller66f8e5b78e1501959ce456384c37e122.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller66f8e5b78e1501959ce456384c37e122.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
Controller66f8e5b78e1501959ce456384c37e122.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller66f8e5b78e1501959ce456384c37e122.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
const Controller66f8e5b78e1501959ce456384c37e122Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller66f8e5b78e1501959ce456384c37e122.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
Controller66f8e5b78e1501959ce456384c37e122Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller66f8e5b78e1501959ce456384c37e122.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/fixed-assets'
*/
Controller66f8e5b78e1501959ce456384c37e122Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller66f8e5b78e1501959ce456384c37e122.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller66f8e5b78e1501959ce456384c37e122.form = Controller66f8e5b78e1501959ce456384c37e122Form
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
const Controller0087b42306d1a9bfc8523a1efde238a0 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller0087b42306d1a9bfc8523a1efde238a0.url(options),
    method: 'get',
})

Controller0087b42306d1a9bfc8523a1efde238a0.definition = {
    methods: ["get","head"],
    url: '/periods/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
Controller0087b42306d1a9bfc8523a1efde238a0.url = (options?: RouteQueryOptions) => {
    return Controller0087b42306d1a9bfc8523a1efde238a0.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
Controller0087b42306d1a9bfc8523a1efde238a0.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller0087b42306d1a9bfc8523a1efde238a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
Controller0087b42306d1a9bfc8523a1efde238a0.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller0087b42306d1a9bfc8523a1efde238a0.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
const Controller0087b42306d1a9bfc8523a1efde238a0Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller0087b42306d1a9bfc8523a1efde238a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
Controller0087b42306d1a9bfc8523a1efde238a0Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller0087b42306d1a9bfc8523a1efde238a0.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/periods/history'
*/
Controller0087b42306d1a9bfc8523a1efde238a0Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: Controller0087b42306d1a9bfc8523a1efde238a0.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

Controller0087b42306d1a9bfc8523a1efde238a0.form = Controller0087b42306d1a9bfc8523a1efde238a0Form
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
    '/accounts': Controller577f898b9efe99e2813f63fd231bd8c7,
    '/income': Controller8697b0142b391538b910a8d7291265c2,
    '/reconciliation': Controller5fbe311172c80aea24e168c1390225a1,
    '/categories': Controller7a4f8d9d0be39757f6a1352cf8f1ab45,
    '/transactions': Controllere5aa2cad321b30063c3b415df5452200,
    '/exchange-rates': Controller9ec6ff571c4d5816f375bbafc9964ac9,
    '/budgets': Controllerd65bcf739ad2a9a13b6c3c100ab1c5e2,
    '/financial-summary': Controllerf28969a658a3db543064530fa037e4a0,
    '/balance-sheet': Controller2cd4284799517c9d71a5ee276641e546,
    '/balance-sheet/time-series': Controllerc7faafe80c37793e81ea6a8d0f57649e,
    '/fixed-assets': Controller66f8e5b78e1501959ce456384c37e122,
    '/periods/history': Controller0087b42306d1a9bfc8523a1efde238a0,
    '/import': Controller319c434a45921953484cb2f345f6ad0c,
    '/settings/appearance': Controllere19ee86e9cf603ce1a59a1ec5d21dec5,
}

export default Controller