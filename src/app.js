angular.module('app', [
    'ui.router'
])
.config(($locationProvider, $urlMatcherFactoryProvider, $stateProvider) => {
    $locationProvider.hashPrefix('')
    $urlMatcherFactoryProvider.strictMode(false)
    $stateProvider.state({
        name: 'home',
        url: '',
        template: '<h1>Hello world</h1>'
    })
})
