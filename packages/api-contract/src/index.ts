/**
 * Shared HTTP contract. Types plus a handful of tiny, dependency-free type
 * guards (`isProblemDetail`, `isPaymentRequiredProblem`, `firstFieldError`) so
 * every client parses errors the same way. The prose version of the contract
 * (paths, status codes, error shapes) is in ../CONTRACT.md.
 */
export * from './auth';
export * from './billing';
export * from './common';
export * from './health';
