var config = module.exports;

config["Tests"] = {
    sources: [
        //"lib/mylib.js",
        //"lib/**/*.js"
    ],
    tests: [
        "test/*-test.js"
    ]
};

//config["Browser tests"] = {
//    extends: "Tests",
//    environment: "browser"
//};

config["Node tests"] = {
    extends: "Tests",
    environment: "node"
};

// Add more configuration groups as needed
