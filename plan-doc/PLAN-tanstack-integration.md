# PLAN-tanstack-integration

## Goal

Achieve "Perfect" integration of the TanStack ecosystem (Query, Router, Virtual) to maximize performance, developer experience, and code reliability.

## Audit Findings

- **Query**: v5 installed. `useQuery` used extensively via PowerSync. Missing global error handling, `useMutation` pattern (manual loading states used instead), and DevTools.
- **Router**: v1 installed. Good basics (`createRouter`). Missing `NotFoundRoute`, `ErrorComponent`, `loader` (prefetching), and DevTools.
- **Virtual**: v3 installed. (Usage appears minimal/absent).

## Proposed Changes

### Phase 1: Configuration & DevTools

- [x] **Query**: Add `MutationCache` global callbacks for Toast notifications (automatic error alerting).
- [x] **Query**: Add `<ReactQueryDevtools />` (development only).
- [x] **Router**: Add `<TanStackRouterDevtools />` (development only).

### Phase 2: Router Experience

- [x] **404 Handling**: Created `NotFoundPage` and registered in `router.ts`.
- [x] **Global Error Boundary**: Created `ErrorPage` as default error component.
- [x] **Loaders (POC)**: Refactor `CustomersPage` to use `loader` for data prefetching (render-as-you-fetch pattern).

### Phase 3: Mutation Standardization (Refactor)

- [x] **Refactor `useCustomerMutations`**: Convert to `useMutation` hooks using `@tanstack/react-query` + PowerSync.
  - **Why**: Provides standardized `isPending`, `isSuccess`, `isError` states and `onSuccess`/`onError` callbacks.
  - **Benefit**: Removes manual `try/catch` and `useState` boilerplate in UI components.

### Phase 4: Virtualization

- [x] **Items List**: Implement `@tanstack/react-virtual` for the Inventory list (likely to grow large).
- [x] **Customers List**: Implement virtualization for Customer select dropdowns or lists.

## Verification

- [ ] **DevTools**: Confirm toggle appears in development.
- [ ] **404**: Verify visiting `/invalid-route` shows custom page.
- [x] **Mutations**: Verified mutation hooks work with tests (7 passing).
- [x] **Virtualization**: Verified virtualization renders correctly (24 component tests passing).
