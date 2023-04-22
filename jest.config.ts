import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

const config = {
    testEnvironment: 'node',
}

export default createJestConfig(config)