function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

// Bug: This function doesn't handle division by zero
function divide(a, b) {
    return a / b;
}

module.exports = { subtract, multiply, divide };
