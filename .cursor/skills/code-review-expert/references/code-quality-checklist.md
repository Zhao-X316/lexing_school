# Code Quality Checklist

## Error Handling

### Anti-patterns to Flag

- **Swallowed exceptions**: Empty catch blocks or catch with only logging
- **Overly broad catch**: Catching `Exception`/`Error` base class instead of specific types
- **Error information leakage**: Stack traces or internal details exposed to users
- **Missing error handling**: No try-catch around fallible operations (I/O, network, parsing)
- **Async error handling**: Unhandled promise rejections, missing `.catch()`, no error boundary

### Best Practices to Check

- Errors are caught at appropriate boundaries
- Error messages are user-friendly (no internal details exposed)
- Async errors are properly propagated or handled
- Fallback behavior is defined for recoverable errors

---

## Performance & Caching

### CPU-Intensive Operations

- Expensive operations in hot paths (regex, JSON, crypto in loops)
- Blocking main thread: sync I/O, heavy computation without worker/async
- Missing memoization for pure functions called repeatedly

### Database & I/O

- **N+1 queries**: Loop that makes a query per item instead of batch
- Missing indexes, over-fetching (SELECT *), no pagination

### Caching Issues

- Missing cache for expensive operations
- Cache without TTL or invalidation strategy
- Cache key collisions, caching user-specific data globally

### Memory

- Unbounded collections, large object retention
- String concatenation in loops (use join), loading large files entirely

---

## Boundary Conditions

### Null/Undefined Handling

- Missing null checks, truthy/falsy confusion, optional chaining overuse

### Empty Collections

- Empty array/object not handled, first/last element access without length check

### Numeric Boundaries

- Division by zero, integer overflow, floating point comparison, off-by-one errors

### String Boundaries

- Empty string, whitespace-only, very long strings, Unicode edge cases

### Questions to Ask

- "What if this is null/undefined?"
- "What if this collection is empty?"
- "What's the valid range for this number?"
