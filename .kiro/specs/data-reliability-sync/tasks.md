# Implementation Plan: Data Reliability & Sync

## Overview

This plan implements an offline-first synchronization engine for the Lifestory family tree application. It replaces the current debounced PUT sync with a Write-Ahead Log (WAL) backed by IndexedDB, automatic retry with exponential backoff, version-vector conflict detection, server-side snapshots, and client-side integrity validation. Implementation proceeds bottom-up: core data layer and utilities first, then the sync engine orchestrator, then server-side endpoints, then UI integration.

## Tasks

- [ ] 1. Set up project structure, dependencies, and core types
  - [ ] 1.1 Create sync module directory structure and shared type definitions
    - Create `lib/sync/` directory with barrel `index.ts`
    - Define shared TypeScript interfaces: `Mutation`, `SyncBatch`, `WALEntry`, `SyncStatus`, `SyncStatusInfo`, `SyncEngineConfig`, `ConflictInfo`, `ConflictResolution`, `ValidationError`, `ValidationResult`, `ExportData`, `ImportValidation`
    - Define `FamilyNode` type reference (re-export from existing types)
    - _Requirements: 1.4, 2.1, 4.4, 6.1, 9.1_

  - [ ] 1.2 Add Prisma schema changes for version vector and snapshots
    - Add `version Int @default(1)` field to the `Tree` model
    - Create `TreeSnapshot` model with fields: `id`, `treeId`, `version`, `nodeCount`, `data` (Json), `createdAt`
    - Add relation from `Tree` to `TreeSnapshot[]`
    - Add index on `[treeId, createdAt]` for snapshot queries
    - Run `prisma migrate dev` to generate migration
    - _Requirements: 4.1, 5.1, 5.5_

  - [ ] 1.3 Install and configure fast-check for property-based testing
    - Add `fast-check` as a dev dependency
    - Create `__tests__/sync/` directory structure matching the design's test file organization
    - Create shared test helpers/arbitraries for generating `FamilyNode`, `WALEntry`, and `Mutation` instances
    - _Requirements: All (testing infrastructure)_

- [ ] 2. Implement Write-Ahead Log (WAL)
  - [ ] 2.1 Implement IndexedDB-backed WriteAheadLog
    - Create `lib/sync/WriteAheadLog.ts`
    - Implement IndexedDB database initialization with stores: `wal` (keyPath: `id`, indexes: `seqNo`, `treeId`, `status`, `timestamp`), `meta` (keyPath: `key`), `conflicts` (keyPath: `id`)
    - Implement `append()` with monotonic sequence number generation from `meta` store
    - Implement `acknowledge()` to delete entry by seqNo
    - Implement `markFailed()` and `markPermanentlyFailed()`
    - Implement `getPending()`, `getAllPending()`, `getCount()`
    - Implement `clear()` and `prune(olderThanDays)` for retention policy
    - Implement `isFull()` and `getCapacity()` with 1000-entry IndexedDB limit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 8.4_

  - [ ] 2.2 Implement localStorage fallback for WAL
    - Add fallback detection: try opening IndexedDB, if unavailable switch to localStorage adapter
    - Implement same `WriteAheadLog` interface using localStorage with JSON serialization
    - Enforce 50-mutation limit for localStorage mode
    - Display persistent warning when in fallback mode
    - _Requirements: 1.6, 7.7_

  - [ ]* 2.3 Write property tests for WAL replay ordering (Property 1)
    - **Property 1: WAL Replay Ordering**
    - Test that for any set of WAL entries with distinct sequence numbers, replaying processes them in strictly ascending seqNo order
    - **Validates: Requirements 1.3, 3.4**

  - [ ]* 2.4 Write property tests for WAL entry structure completeness (Property 2)
    - **Property 2: WAL Entry Structure Completeness**
    - Test that every appended entry has non-empty id, monotonically increasing seqNo, positive timestamp, non-empty treeId, and correct payload
    - **Validates: Requirements 1.4**

  - [ ]* 2.5 Write property tests for WAL acknowledge behavior (Property 3)
    - **Property 3: WAL Acknowledge Removes Entry**
    - Test that acknowledging an entry removes exactly that entry, leaving others unchanged
    - **Validates: Requirements 1.5**

  - [ ]* 2.6 Write property tests for WAL capacity enforcement (Property 5)
    - **Property 5: WAL Capacity Enforcement**
    - Test that at max capacity (1000 IndexedDB / 50 localStorage), new appends are rejected and size remains at max
    - **Validates: Requirements 1.8, 7.2, 7.7**

  - [ ]* 2.7 Write property test for WAL retention policy (Property 16)
    - **Property 16: WAL Retention Policy**
    - Test that prune never removes entries less than 7 days old
    - **Validates: Requirements 8.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Retry Queue and Network Detector
  - [ ] 4.1 Implement RetryQueue with exponential backoff
    - Create `lib/sync/RetryQueue.ts`
    - Implement `computeDelay()`: `min(baseDelay * 2^attempt, maxDelay) + random(-jitter, +jitter)`
    - Implement `schedule()`, `getNextDue()`, `cancel()`, `cancelAll()`, `isExhausted()`
    - Default config: baseDelay=1000ms, maxDelay=60000ms, jitter=500ms, maxRetries=10
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 4.2 Write property test for exponential backoff bounds (Property 4)
    - **Property 4: Exponential Backoff Bounds**
    - Test that for any attempt count n, the delay satisfies: `max(0, min(b*2^n, m) - j) ≤ delay ≤ min(b*2^n, m) + j`
    - **Validates: Requirements 1.7, 3.1, 7.6**

  - [ ] 4.3 Implement NetworkDetector
    - Create `lib/sync/NetworkDetector.ts`
    - Use `Navigator.onLine` API for initial state
    - Listen to `online`/`offline` window events
    - Implement periodic health-check requests at 30-second intervals
    - Expose `isOnline()`, `onStatusChange()`, `start()`, `stop()`, `check()`
    - _Requirements: 7.3, 7.4_

- [ ] 5. Implement Integrity Validator
  - [ ] 5.1 Implement IntegrityValidator
    - Create `lib/sync/IntegrityValidator.ts`
    - Implement `checkParentReferences()`: verify all parentIds reference existing nodes
    - Implement `checkBidirectionalPartners()`: verify partner links are symmetric
    - Implement `checkCircularAncestors()`: detect cycles using DFS
    - Implement `checkDuplicateIds()`: detect duplicate node IDs
    - Implement `validate()` that runs all checks and returns `ValidationResult`
    - _Requirements: 6.1, 6.2_

  - [ ]* 5.2 Write property test for integrity validator (Property 15)
    - **Property 15: Integrity Validator Detects All Corruption Types**
    - Test that injected corruption (orphan parent, unidirectional partner, circular ancestor, duplicate ID) returns valid=false with correct error type; well-formed trees return valid=true
    - **Validates: Requirements 6.1, 6.2**

- [ ] 6. Implement Conflict Resolver
  - [ ] 6.1 Implement ConflictResolver with field-level diffing
    - Create `lib/sync/ConflictResolver.ts`
    - Implement `canAutoMerge()`: check if local mutations and server changes affect disjoint node sets
    - Implement `detect()`: perform field-level comparison, return `AutoMergeResult` or `ManualMergeResult`
    - Implement `resolve()`: apply user-selected resolutions to produce final merged nodes
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 6.2 Write property test for field-level diff correctness (Property 10)
    - **Property 10: Field-Level Diff Correctness**
    - Test that for any two FamilyNode instances, the diff identifies exactly the set of differing fields with no false positives or negatives
    - **Validates: Requirements 4.4, 4.6**

  - [ ]* 6.3 Write property test for non-overlapping conflict auto-merge (Property 11)
    - **Property 11: Non-Overlapping Conflict Auto-Merge**
    - Test that when local mutations affect nodes {A} and server changes affect nodes {B} where A∩B=∅, the merge contains all changes from both
    - **Validates: Requirements 4.5**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement SyncEngine orchestrator
  - [ ] 8.1 Implement core SyncEngine class
    - Create `lib/sync/SyncEngine.ts`
    - Wire together WAL, RetryQueue, NetworkDetector, IntegrityValidator, ConflictResolver
    - Implement `enqueue()`: validate → WAL.persist → apply to state → schedule flush
    - Implement `flush()`: batch pending mutations → validate integrity → send to API → handle response
    - Implement `initialize()`: replay pending WAL entries on startup
    - Implement `pause()`, `resume()`, `destroy()` lifecycle methods
    - Implement debounced flush (300ms default)
    - _Requirements: 1.1, 1.3, 1.7, 3.3, 3.4, 3.5, 6.3, 7.1_

  - [ ] 8.2 Implement sync status state machine
    - Track status transitions: saved ↔ syncing ↔ pending ↔ offline ↔ error
    - Implement `getStatus()` and `onStatusChange()` subscription
    - Implement pending count display logic (exact for 0-99, "99+" for >99)
    - Register/unregister `beforeunload` handler based on pending count
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ] 8.3 Implement error handling and retry integration
    - Handle 409 → delegate to ConflictResolver
    - Handle 401 → pause sync, emit auth-required event
    - Handle 400 → mark permanently failed, notify user
    - Handle 5xx/network → schedule retry via RetryQueue
    - Implement `retryFailed()` and `forceSync()` manual controls
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1_

  - [ ]* 8.4 Write property test for sync status state machine (Property 6)
    - **Property 6: Sync Status State Machine Validity**
    - Test that for any sequence of sync events, the status is always exactly one of the valid states
    - **Validates: Requirements 2.1**

  - [ ]* 8.5 Write property test for pending count display format (Property 7)
    - **Property 7: Pending Count Display Format**
    - Test that counts 0-99 produce exact decimal strings, and counts >99 produce "99+"
    - **Validates: Requirements 2.4**

- [ ] 9. Implement server-side sync API endpoint
  - [ ] 9.1 Create PATCH /api/trees/[id]/sync endpoint
    - Create `app/api/trees/[id]/sync/route.ts`
    - Parse `SyncRequest` body (mutations array + clientVersion)
    - Validate session authentication
    - Read current tree version from database
    - If clientVersion matches: apply mutations, increment version, respond with `SyncResponse`
    - If clientVersion mismatches: respond with 409 `ConflictResponse` including current server state
    - Use Prisma transaction for atomicity
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 9.2 Write property test for version vector monotonicity (Property 8)
    - **Property 8: Version Vector Monotonicity**
    - Test that successive successful writes produce strictly increasing versions with no gaps
    - **Validates: Requirements 4.1**

  - [ ]* 9.3 Write property test for version mismatch rejection (Property 9)
    - **Property 9: Version Mismatch Rejection**
    - Test that mismatched client version always produces 409 without modifying tree data
    - **Validates: Requirements 4.3**

- [ ] 10. Implement Backup Manager
  - [ ] 10.1 Implement server-side BackupManager
    - Create `lib/sync/BackupManager.ts`
    - Implement `createSnapshot()`: serialize current tree state to `TreeSnapshot` record
    - Implement `listSnapshots()`: query sorted by createdAt desc, return metadata only
    - Implement `getSnapshot()`: fetch full snapshot data by ID
    - Implement `restoreSnapshot()`: replace tree state within a transaction, create pre-restore snapshot
    - Implement `pruneOldSnapshots()`: delete oldest when count exceeds 50
    - Handle creation failures gracefully (log and continue)
    - Handle restore failures with rollback
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7_

  - [ ] 10.2 Create backup/restore API endpoints
    - Create `app/api/trees/[id]/snapshots/route.ts` (GET list, POST create)
    - Create `app/api/trees/[id]/snapshots/[snapshotId]/route.ts` (GET detail)
    - Create `app/api/trees/[id]/snapshots/[snapshotId]/restore/route.ts` (POST restore)
    - Validate authentication and tree ownership on all endpoints
    - _Requirements: 5.3, 5.4_

  - [ ]* 10.3 Write property test for snapshot retention limit (Property 12)
    - **Property 12: Snapshot Retention Limit**
    - Test that after any creation, total snapshots ≤ 50 and removed snapshot is always the oldest
    - **Validates: Requirements 5.2**

  - [ ]* 10.4 Write property test for restore produces exact snapshot state (Property 13)
    - **Property 13: Restore Produces Exact Snapshot State**
    - Test that restoring a snapshot results in tree nodes deeply equal to snapshot data, and a pre-restore snapshot exists
    - **Validates: Requirements 5.4**

  - [ ]* 10.5 Write property test for failed restore preserves original state (Property 14)
    - **Property 14: Failed Restore Preserves Original State**
    - Test that a failed restore leaves tree state unchanged
    - **Validates: Requirements 5.7**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Export/Import module
  - [ ] 12.1 Implement ExportManager
    - Create `lib/sync/ExportManager.ts`
    - Implement `export()`: serialize tree to JSON Blob with version, exportedAt, tree data
    - Generate filename: `{sanitized-tree-name}-{YYYY-MM-DD}.json` (non-alphanumeric → hyphens)
    - Implement `validateImport()`: check JSON validity, size ≤ 50MB, required fields (id, name, nodes array), detect duplicate IDs
    - Implement `parseImport()`: parse validated file into `ExportData`
    - Support offline export using local state
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 12.2 Write property test for export/import round-trip (Property 17)
    - **Property 17: Export/Import Round-Trip**
    - Test that exporting then importing produces equivalent tree data (same id, name, nodes)
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 12.3 Write property test for export filename format (Property 18)
    - **Property 18: Export Filename Format**
    - Test that generated filenames match `{sanitized-name}-{YYYY-MM-DD}.json` pattern
    - **Validates: Requirements 9.2**

  - [ ]* 12.4 Write property test for import duplicate ID detection (Property 19)
    - **Property 19: Import Duplicate ID Detection**
    - Test that overlapping node IDs between import and existing tree are correctly identified
    - **Validates: Requirements 9.5**

- [ ] 13. Integrate SyncEngine with useTreeState hook
  - [ ] 13.1 Create useSyncEngine React hook
    - Create `lib/sync/useSyncEngine.ts`
    - Initialize SyncEngine on mount, destroy on unmount
    - Expose `enqueue`, `getStatus`, `forceSync`, `retryFailed`
    - Subscribe to status changes and expose reactive `syncStatus` state
    - Handle session expiration events (emit to auth context)
    - _Requirements: 1.1, 2.1, 8.1, 8.2, 8.3_

  - [ ] 13.2 Refactor useTreeState to use SyncEngine
    - Remove direct `localStorage` writes (`saveTrees` calls)
    - Remove debounced `saveTreeNodes` call
    - Replace mutation persistence with `syncEngine.enqueue()` calls in `addNode`, `updateNode`, `deleteNode`
    - Subscribe to SyncEngine status for `syncStatus` state variable
    - Add `beforeunload` handler delegation to SyncEngine
    - _Requirements: 1.1, 2.9, 7.1_

- [ ] 14. Implement UI components
  - [ ] 14.1 Implement SyncStatusIndicator component
    - Create `components/tree/SyncStatusIndicator.tsx`
    - Display status icon and label for each state: saved (checkmark), syncing (spinner), pending (clock + count), offline (cloud-off), error (warning + retry button)
    - Show pending count (exact for ≤99, "99+" for >99)
    - Show error message and manual retry button in error state
    - Show offline message indicating local storage of changes
    - Ensure accessibility: aria-live region for status changes
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [ ] 14.2 Implement ConflictResolutionModal component
    - Create `components/tree/ConflictResolutionModal.tsx`
    - Display field-level diffs: local value vs server value for each conflicting field
    - Allow per-field selection of local or server version
    - Show 5-minute timeout indicator
    - Handle timeout: preserve both versions, show persistent conflict indicator
    - _Requirements: 4.6, 4.7, 4.8, 4.9_

  - [ ] 14.3 Implement SessionExpirationPrompt component
    - Create `components/tree/SessionExpirationPrompt.tsx`
    - Non-blocking overlay/toast prompting re-authentication
    - Allow dismissal (changes remain in WAL)
    - Show persistent indicator when dismissed
    - Allow continued editing while prompt is visible
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

  - [ ] 14.4 Implement ExportImportControls component
    - Create `components/tree/ExportImportControls.tsx`
    - Single-action export button that triggers JSON download
    - Import file picker with validation feedback
    - Show import errors with specific validation failure details
    - Prompt for merge vs replace when duplicate IDs detected
    - Support offline export
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Wire UI components into tree editor and final integration
  - [ ] 16.1 Integrate SyncStatusIndicator into FamilyTreeCanvas
    - Add `SyncStatusIndicator` to the tree editor layout
    - Connect to `useSyncEngine` hook status
    - Position in a non-intrusive but always-visible location
    - _Requirements: 2.1_

  - [ ] 16.2 Integrate ConflictResolutionModal into tree editor
    - Listen for conflict events from SyncEngine
    - Show modal when manual resolution required
    - Pass resolved conflicts back to SyncEngine
    - _Requirements: 4.6, 4.9_

  - [ ] 16.3 Integrate SessionExpirationPrompt into app layout
    - Listen for auth-required events from SyncEngine
    - Show prompt without navigating away from editor
    - On successful re-auth, signal SyncEngine to resume
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 16.4 Integrate ExportImportControls into tree editor toolbar
    - Add export/import buttons to existing tree toolbar or settings panel
    - Wire export to ExportManager with current tree data
    - Wire import to ExportManager validation + tree state update
    - _Requirements: 9.1, 9.3_

  - [ ] 16.5 Trigger snapshot creation in sync endpoint on successful write
    - After successful mutation application in `/api/trees/[id]/sync`, call `BackupManager.createSnapshot()` asynchronously
    - Ensure snapshot failure does not block the sync response
    - _Requirements: 5.1, 5.6_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, matching the existing Next.js + Prisma stack
- IndexedDB operations should use the `idb` wrapper library for cleaner async/await usage
- All sync operations must be non-blocking to maintain UI responsiveness

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "4.1", "4.3", "5.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7", "4.2", "5.2", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "8.1", "12.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "9.1", "10.1", "12.2", "12.3", "12.4"] },
    { "id": 5, "tasks": ["8.4", "8.5", "9.2", "9.3", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 6, "tasks": ["13.1", "13.2"] },
    { "id": 7, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 8, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] }
  ]
}
```
