const { greet } = require('./file1');
const { divide } = require('./file2');

function main() {
    greet('World');
    console.log('10 divided by 2 is:', divide(10, 2));
    console.log('5 divided by 0 is:', divide(5, 0)); // This will cause an error
}

main();