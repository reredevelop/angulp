angular.module("app", [])
.controller("Foo", function () {
    this.bar = function () {
        console.log("hello");
        x()
    };
    this.users = ["a", "b", "c"];
    console.log("ok");
})

.directive("gg", function () {
    return {
        templateUrl: "foo.html",
        controller: function () {
            this.users = ["a", "b", "c"];
            console.log(moment().add(1, "day").toISOString());
        },
        controllerAs: "$ctrl"
    };
});

const x = () => {
    console.log("ok");
}
