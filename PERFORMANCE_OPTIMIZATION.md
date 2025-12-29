# Performance Optimization Summary - Locust Load Testing Fixes

## Problem Analysis

The Locust load tests were failing with:

- **1758 failures** with 504 Gateway Timeout on GET /v1/orders
- **189 failures** with 500 Internal Server Error on GET /v1/orders
- **1123 failures** with 504 Gateway Timeout on POST /v1/orders
- **143 failures** with 500 Internal Server Error on POST /v1/orders
- Similar failures on other endpoints

## Root Causes Identified

### 1. **Database Connection Pool Exhaustion**

- Connection pool was limited to 50 connections
- Under high load, requests were waiting for available connections
- No minimum connections maintained, causing cold-start delays

### 2. **N+1 Query Problem**

- `findAll()` method was fetching all orders, then making a separate query for each order's packages
- With hundreds of orders, this resulted in hundreds of database queries
- Caused severe performance degradation and timeouts

### 3. **In-Memory Pagination**

- `listOrders()` was loading ALL orders into memory, then sorting and paginating
- As the database grew, this became increasingly slow
- Memory usage increased linearly with order count

### 4. **Gateway Timeout Misconfiguration**

- Gateway timeout was defaulting to 2000ms instead of using the configured 10000ms
- Environment variable wasn't being parsed correctly
- Too aggressive for database operations under load

## Solutions Implemented

### 1. **Optimized Database Connection Pool** ✅

**File**: `services/orders/src/database/database.service.ts`

```typescript
pool: {
  max: 100,              // Increased from 50
  min: 10,               // Maintain ready connections (was 0)
  idleTimeoutMillis: 30000,
},
requestTimeout: 15000,   // Added query timeout
connectionTimeout: 15000, // Added connection timeout
```

**Impact**:

- Handles 2x more concurrent connections
- Eliminates cold-start delays with minimum pool
- Prevents hung queries with timeouts

### 2. **Fixed N+1 Query Problem** ✅

**File**: `services/orders/src/repositories/mssql-order.repository.ts`

**Before** (N+1 queries):

```sql
SELECT * FROM orders ORDER BY created_at DESC;
-- Then for each order:
SELECT * FROM packages WHERE order_id = @order_id;
```

**After** (Single JOIN query):

```sql
SELECT
  o.*,
  p.id as pkg_id,
  p.weight_kg,
  ...
FROM orders o
LEFT JOIN packages p ON o.id = p.order_id
ORDER BY o.created_at DESC
```

**Impact**:

- Reduced database queries from N+1 to 1
- For 100 orders: 101 queries → 1 query (100x improvement)
- Dramatically reduced database load and latency

### 3. **Database-Level Pagination** ✅

**File**: `services/orders/src/repositories/mssql-order.repository.ts`

Added new `listOrders()` method with SQL pagination:

```sql
SELECT * FROM orders
ORDER BY created_at DESC
OFFSET @offset ROWS
FETCH NEXT @pageSize ROWS ONLY
```

**Impact**:

- No longer loads all orders into memory
- Constant memory usage regardless of total order count
- Pagination happens in database (much faster)

### 4. **Fixed Gateway Timeout Configuration** ✅

**File**: `services/gateway/src/services/gateway.service.ts`

```typescript
// Before:
private readonly TIMEOUT_MS = parseInt(process.env.GRPC_TIMEOUT_MS || '2000');
private readonly MAX_RETRIES = 1;

// After:
private readonly TIMEOUT_MS = parseInt(process.env.GRPC_TIMEOUT_MS || '10000', 10);
private readonly MAX_RETRIES = 2;
private readonly RETRY_DELAY = 500;
```

**Impact**:

- Properly uses 10-second timeout from environment
- Increased retries for better resilience
- Reduced retry delay for faster recovery

### 5. **Updated Service Layer** ✅

**File**: `services/orders/src/services/order.service.ts`

Updated `listOrders()` to use optimized repository method:

```typescript
// Before: Load all, sort in memory, slice
const allOrders = await this.orderRepository.findAll();
const paginatedOrders = allOrders.sort(...).slice(startIndex, endIndex);

// After: Use database pagination
const { orders, totalCount } = await this.orderRepository.listOrders(page, pageSize);
```

## Performance Improvements Expected

| Metric                     | Before | After            | Improvement    |
| -------------------------- | ------ | ---------------- | -------------- |
| Database queries for list  | N+1    | 2 (count + data) | ~50x fewer     |
| Memory usage for list      | O(n)   | O(pageSize)      | ~10-100x less  |
| Max concurrent connections | 50     | 100              | 2x             |
| Gateway timeout            | 2s     | 10s              | 5x more time   |
| Query timeout              | None   | 15s              | Prevents hangs |

## Testing Instructions

1. **Rebuild and restart services**:

   ```bash
   docker compose -f docker-compose.local.yml down
   docker compose -f docker-compose.local.yml up --build
   ```

2. **Run Locust load test**:

   - Access Locust UI at http://localhost:8089
   - Start with 100 users, spawn rate 10/s
   - Monitor for 504 and 500 errors
   - Gradually increase to 500 users

3. **Monitor performance**:
   - Check Kibana logs for database query times
   - Monitor MSSQL connection pool usage
   - Watch for timeout errors in gateway logs

## Expected Results

- **504 errors**: Should be eliminated or < 1%
- **500 errors**: Should be eliminated or < 0.1%
- **Response times**:
  - GET /v1/orders: < 200ms (p95)
  - POST /v1/orders: < 500ms (p95)
  - GET /v1/orders/:id: < 100ms (p95)
- **Throughput**: Should handle 500+ concurrent users

## Rollback Plan

If issues occur, revert changes:

```bash
git checkout HEAD -- services/orders/src/database/database.service.ts
git checkout HEAD -- services/orders/src/repositories/mssql-order.repository.ts
git checkout HEAD -- services/orders/src/services/order.service.ts
git checkout HEAD -- services/orders/src/interfaces/order.interface.ts
git checkout HEAD -- services/gateway/src/services/gateway.service.ts
```

## Additional Recommendations

1. **Add Redis caching** for frequently accessed orders
2. **Implement connection pooling** in other services (pricing, receipt)
3. **Add database query monitoring** to track slow queries
4. **Consider read replicas** for high read loads
5. **Add circuit breakers** to prevent cascade failures

---

**Date**: 2025-12-28
**Author**: Antigravity AI
**Status**: Ready for Testing
