# Requirements Document

## Introduction

Lifestory is a production family tree application (lifestory.co.id) where users build and maintain detailed family histories including names, relationships, biographies, and photos. The current sync architecture uses localStorage as a write-through cache with a debounced 600ms PUT to the server. This creates multiple data loss vectors: silent sync failures, session expiration during edits, localStorage eviction, and no conflict resolution for multi-device editing.

This feature introduces a comprehensive data reliability and synchronization system that guarantees zero data loss for paying users. It covers write-ahead logging, sync status visibility, conflict resolution, automatic retry with exponential backoff, and backup/recovery mechanisms.

## Glossary

- **Sync_Engine**: The client-side module responsible for persisting changes to the server, managing retry queues, and reporting sync status to the UI
- **Write_Ahead_Log**: A persistent client-side queue (IndexedDB-backed) that records every mutation before it is sent to the server, ensuring no edit is lost even if the browser crashes
- **Sync_Status_Indicator**: The UI component that displays the current synchronization state to the user (saved, syncing, pending, offline, error)
- **Conflict_Resolver**: The module that detects and resolves concurrent edits to the same tree from multiple devices or sessions
- **Version_Vector**: A per-tree monotonically increasing version number stored server-side, used to detect conflicting writes
- **Backup_Manager**: The server-side module responsible for creating, storing, and restoring periodic snapshots of tree data
- **Retry_Queue**: The ordered list of failed sync operations awaiting retry with exponential backoff
- **Tree_Snapshot**: A complete point-in-time copy of all nodes and edges for a given tree, stored for recovery purposes

## Requirements

### Requirement 1: Write-Ahead Log for Mutation Persistence

**User Story:** As a user editing my family tree, I want every change I make to be durably recorded immediately, so that no edit is lost even if my browser crashes or the network fails.

#### Acceptance Criteria

1. WHEN a user performs a mutation (add, update, or delete node), THE Write_Ahead_Log SHALL persist the mutation to IndexedDB and confirm the write before updating the in-memory state
2. THE Write_Ahead_Log SHALL retain all pending mutations in IndexedDB such that they survive browser close, crash, or page refresh without data loss
3. WHEN the application starts with pending mutations in the Write_Ahead_Log, THE Sync_Engine SHALL replay all pending mutations to the server in ascending order of their monotonically increasing sequence number
4. THE Write_Ahead_Log SHALL store each mutation with a unique identifier, a monotonically increasing sequence number, a timestamp, a tree identifier, and the full node state after mutation
5. WHEN a mutation is successfully acknowledged by the server, THE Write_Ahead_Log SHALL remove that mutation from the pending queue
6. IF IndexedDB is unavailable, THEN THE Sync_Engine SHALL fall back to localStorage with a maximum queue size of 50 mutations and display a persistent warning indicating that storage capacity is limited
7. IF replay of a pending mutation fails due to a server error or network failure, THEN THE Sync_Engine SHALL stop replay, retain the failed mutation and all subsequent mutations in the queue, and retry replay using exponential backoff starting at 1 second up to a maximum interval of 60 seconds
8. THE Write_Ahead_Log SHALL enforce a maximum queue size of 1000 pending mutations when using IndexedDB, and IF the queue is full, THEN THE Write_Ahead_Log SHALL reject the new mutation and display an error indicating that offline capacity has been reached

### Requirement 2: Sync Status Visibility

**User Story:** As a user, I want to always know whether my data is saved, syncing, or at risk, so that I can make informed decisions about closing the browser or switching devices.

#### Acceptance Criteria

1. THE Sync_Status_Indicator SHALL display one of the following mutually exclusive states: "saved", "syncing", "pending", "offline", or "error"
2. WHEN all mutations have been acknowledged by the server, THE Sync_Status_Indicator SHALL display "saved" within 1 second of acknowledgment
3. WHEN a mutation is in transit to the server, THE Sync_Status_Indicator SHALL display "syncing"
4. WHEN mutations exist in the Write_Ahead_Log but have not yet been sent, THE Sync_Status_Indicator SHALL display "pending" with a numeric count of unsent changes (displayed as the exact integer for counts up to 99, or "99+" for counts exceeding 99)
5. WHEN the network is unavailable, THE Sync_Status_Indicator SHALL display "offline" and indicate that changes are stored in the Write_Ahead_Log and will sync when connectivity resumes
6. IF a sync attempt fails after 3 retry attempts are exhausted, THEN THE Sync_Status_Indicator SHALL display "error" with a message describing the failure reason and a manual retry button
7. WHEN the user activates the manual retry button, THE Sync_Engine SHALL re-attempt synchronization of all failed mutations and transition the Sync_Status_Indicator to "syncing"
8. WHEN network connectivity is restored after an "offline" state, THE Sync_Engine SHALL automatically transition to "syncing" and begin sending queued mutations within 5 seconds of detecting connectivity
9. WHEN the user attempts to close the browser tab while the Sync_Status_Indicator displays "pending" or "syncing", THE Sync_Engine SHALL trigger a beforeunload warning indicating the number of unsynced changes

### Requirement 3: Automatic Retry with Exponential Backoff

**User Story:** As a user on an unstable connection, I want the app to automatically retry failed saves without my intervention, so that my data eventually reaches the server without manual effort.

#### Acceptance Criteria

1. WHEN a sync request fails due to a network error (connection timeout, DNS resolution failure, TCP connection refused, or request timeout exceeding 30 seconds) or a server HTTP 5xx response, THE Retry_Queue SHALL schedule a retry with exponential backoff starting at 1 second, doubling the delay on each subsequent attempt, up to a maximum interval of 60 seconds, with a random jitter of ±500 milliseconds added to each delay
2. IF the Retry_Queue has attempted 10 retries for a single mutation and all have failed, THEN THE Retry_Queue SHALL mark the mutation as permanently failed, cease further retry attempts for that mutation, and notify the user that the save could not be completed
3. WHEN the network transitions from offline to online, THE Sync_Engine SHALL begin flushing all pending mutations in the Retry_Queue within 2 seconds of detecting connectivity restoration
4. WHILE retries are in progress, THE Sync_Engine SHALL preserve mutation ordering so that earlier edits are applied before later edits
5. IF a sync request fails with HTTP 401 (unauthorized), THEN THE Sync_Engine SHALL pause all retries across the queue and prompt the user to re-authenticate before resuming
6. IF a sync request fails with HTTP 400 (validation error), THEN THE Sync_Engine SHALL mark the mutation as permanently failed, remove it from the retry queue, and notify the user with the validation details
7. WHEN the application is closed or restarted while mutations remain in the Retry_Queue, THE Sync_Engine SHALL persist all pending mutations to local storage and restore them to the queue upon next application launch

### Requirement 4: Conflict Detection and Resolution

**User Story:** As a user who edits my family tree from multiple devices, I want the system to detect conflicting edits and help me resolve them, so that no one's changes are silently overwritten.

#### Acceptance Criteria

1. THE server SHALL maintain a Version_Vector (integer version starting at 1) for each tree, and WHEN a successful write is committed, THE server SHALL increment the Version_Vector by 1
2. WHEN the Sync_Engine sends a mutation, THE Sync_Engine SHALL include the last known Version_Vector value in the request header
3. IF the server receives a write with a Version_Vector that does not match the current Version_Vector, THEN THE server SHALL respond with HTTP 409 (conflict) and include the current server state for all nodes modified in the rejected write
4. WHEN the Sync_Engine receives a 409 conflict response, THE Conflict_Resolver SHALL perform a field-level comparison between the local pending mutations and the server state to identify which nodes and fields differ
5. WHEN a conflict is detected and changes affect different nodes, THE Conflict_Resolver SHALL automatically apply both the local and server changes to produce a merged state without user intervention
6. WHEN a conflict is detected and changes affect the same fields of the same node, THE Conflict_Resolver SHALL present the local version and the server version of the conflicting fields to the user and allow the user to select either the local version or the server version for each conflicting field
7. IF the user does not resolve a conflict within 5 minutes of presentation, THEN THE Conflict_Resolver SHALL preserve both versions locally and display a persistent indicator that an unresolved conflict exists
8. WHILE a conflict is pending resolution, THE Sync_Engine SHALL queue any new local mutations for the affected nodes and SHALL NOT send them to the server until the conflict is resolved
9. THE Conflict_Resolver SHALL retain all local and server versions of conflicting data until the user explicitly selects a resolution, and SHALL display a notification to the user whenever a conflict requires manual resolution

### Requirement 5: Server-Side Backup and Recovery

**User Story:** As a paying user, I want automatic backups of my family tree data, so that I can recover from accidental deletions or data corruption.

#### Acceptance Criteria

1. WHEN a successful write changes one or more nodes, THE Backup_Manager SHALL create a Tree_Snapshot within 5 seconds of write completion
2. THE Backup_Manager SHALL retain the 50 most recent Tree_Snapshots per tree and SHALL delete the oldest snapshot when a new snapshot would exceed the limit of 50
3. WHEN a user requests a restore, THE Backup_Manager SHALL present a list of available snapshots sorted by creation time descending (most recent first), displaying the timestamp and node count for each snapshot
4. WHEN a user selects a snapshot to restore, THE Backup_Manager SHALL replace the current tree state with the snapshot data and create a new snapshot of the pre-restore state
5. THE Backup_Manager SHALL store snapshots in a separate database table from the live tree data
6. IF a snapshot creation fails, THEN THE Backup_Manager SHALL log the failure and continue serving the write request without blocking the user
7. IF a restore operation fails, THEN THE Backup_Manager SHALL roll back the tree to its pre-restore state, retain the original snapshot, and display an error message indicating the restore could not be completed

### Requirement 6: Client-Side Data Integrity Validation

**User Story:** As a user, I want the system to detect if my local data becomes corrupted, so that corrupted data is never synced to the server and overwrites good data.

#### Acceptance Criteria

1. WHEN the Sync_Engine prepares a mutation for sync, THE Sync_Engine SHALL validate the tree data structure for referential integrity by confirming: all parentIds reference existing nodes within the tree, all partner links are bidirectional, no node references itself as its own ancestor (circular reference detection), and no duplicate node IDs exist
2. WHEN the application loads tree data from the server, THE Sync_Engine SHALL validate the received data using the same referential integrity checks defined in criterion 1 before applying it to local state
3. IF validation detects corruption in the local state, THEN THE Sync_Engine SHALL halt sync for the affected tree, display a non-dismissable notification to the user indicating data corruption was detected, and present an option to reload from the last successfully synchronized server snapshot
4. IF server data fails validation, THEN THE Sync_Engine SHALL reject the incoming data, retain the current local state unchanged, and display a notification to the user indicating the server data could not be applied due to integrity errors
5. WHILE sync is halted due to detected corruption, THE Sync_Engine SHALL prevent any further mutations on the affected tree from being queued for sync until the user either reloads from the server snapshot or the corruption is resolved through re-validation

### Requirement 7: Offline-First Operation

**User Story:** As a user in an area with unreliable internet, I want to continue editing my family tree offline with confidence that all changes will sync when connectivity returns.

#### Acceptance Criteria

1. WHILE the network is unavailable, THE Sync_Engine SHALL allow all tree editing operations to continue using local state
2. WHILE offline, THE Write_Ahead_Log SHALL continue recording all mutations for later sync, up to a maximum of 10,000 entries or 50 MB of local storage
3. WHEN connectivity is restored, THE Sync_Engine SHALL automatically begin flushing the Write_Ahead_Log to the server within 5 seconds of detecting a stable connection
4. THE Sync_Engine SHALL detect network availability using both the Navigator.onLine API and periodic health-check requests to the server at intervals of 30 seconds
5. WHILE offline, THE Sync_Status_Indicator SHALL display a persistent visual indicator showing the offline state and the number of pending unsynced changes
6. IF flushing the Write_Ahead_Log fails due to a network error or server error, THEN THE Sync_Engine SHALL retry the flush using exponential backoff starting at 5 seconds, up to a maximum of 3 retry attempts per entry before marking the entry as failed and notifying the user
7. IF the Write_Ahead_Log reaches its maximum capacity while offline, THEN THE Sync_Engine SHALL prevent further editing operations and display a message indicating that local storage is full and connectivity is required to continue

### Requirement 8: Graceful Session Expiration Handling

**User Story:** As a user whose session expires while editing, I want my unsaved changes to be preserved and synced after I re-authenticate, so that I never lose work due to session timeout.

#### Acceptance Criteria

1. WHEN the Sync_Engine receives an HTTP 401 response during sync, THE Sync_Engine SHALL preserve all pending mutations in the Write_Ahead_Log and halt further sync attempts until re-authentication succeeds
2. WHEN the Sync_Engine detects session expiration, THE Sync_Engine SHALL display a non-blocking re-authentication prompt within 2 seconds without navigating away from the editor, and the user SHALL remain able to continue editing
3. WHEN the user successfully re-authenticates, THE Sync_Engine SHALL resume syncing all pending mutations from the Write_Ahead_Log in the original chronological order within 5 seconds of successful re-authentication
4. THE Write_Ahead_Log SHALL retain pending mutations for a minimum of 7 days regardless of session state
5. WHILE the session is expired, THE Sync_Engine SHALL continue appending new local mutations to the Write_Ahead_Log so that edits made before re-authentication are not lost
6. IF the user dismisses the re-authentication prompt or re-authentication fails 3 consecutive times, THEN THE Sync_Engine SHALL continue to preserve all pending mutations in the Write_Ahead_Log and display a persistent indicator that changes are saved locally but not yet synced
7. IF the Write_Ahead_Log exceeds 10,000 pending mutations, THEN THE Sync_Engine SHALL display a warning indicating that local storage is approaching capacity and prompt the user to re-authenticate

### Requirement 9: Manual Export and Recovery

**User Story:** As a user, I want to manually export my family tree data at any time, so that I have a personal backup independent of the system.

#### Acceptance Criteria

1. THE application SHALL provide a single-action export control that downloads the complete tree data as a JSON file containing all nodes, edges, metadata, and media references, with a maximum export time of 10 seconds for trees up to 500 nodes
2. WHEN a user initiates an export, THE application SHALL generate a JSON file named with the tree name and current date, with a maximum file size of 50 MB
3. WHEN a user imports a previously exported JSON file, THE application SHALL validate that the file contains valid JSON, does not exceed 50 MB, and conforms to the expected tree data structure (required fields: id, name, nodes array) before applying it
4. IF an imported file fails structure validation, THEN THE application SHALL display an error message indicating which validation check failed and SHALL NOT modify the existing tree data
5. IF an imported file contains node IDs that already exist in the current tree, THEN THE application SHALL prompt the user to choose between merging the imported nodes with existing data or replacing all existing data with the imported file
6. WHILE the application is offline, THE application SHALL allow export using the locally stored tree state as the data source
