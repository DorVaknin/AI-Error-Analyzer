function divide(a, b) {
    // Bug: This function doesn't handle division by zero
    return a / b;
}

function multiply(a, b) {
    return a * b;
}

module.exports = { divide, multiply };