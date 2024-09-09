const { add } = require('./file1');
const { subtract, multiply, divide } = require('./file4');

class Calculator {
    constructor() {
        this.memory = 0;
    }

    add(a, b) {
        return add(a, b);
    }

    subtract(a, b) {
        return subtract(a, b);
    }

    multiply(a, b) {
        return multiply(a, b);
    }

    divide(a, b) {
        return divide(a, b);
    }

    // Bug: This method doesn't check for negative numbers
    squareRoot(a) {
        return Math.sqrt(a);
    }

    memoryClear() {
        this.memory = 0;
    }

    memoryRecall() {
        return this.memory;
    }

    memoryAdd(value) {
        this.memory += value;
    }

    memorySubtract(value) {
        this.memory -= value;
    }
}

module.exports = Calculator;