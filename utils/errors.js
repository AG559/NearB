
class DuplicateEmailError extends Error {
    constructor() {
        super();
        this.message = 'Email is already registered';
        this.statusCode = 409;
    }
}

class IncorrectEmailError extends Error {
    constructor() {
        super();
        this.message = 'Email is not registered';
        this.statusCode = 409;
    }
}

class IncorrectPasswordError extends Error {
    constructor() {
        super();
        this.message = 'Password is incorrect';
        this.statusCode = 401;
    }
}

module.exports = {
    IncorrectEmailError,
    IncorrectPasswordError,
    DuplicateEmailError
}
