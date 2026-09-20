# Graph Report - ClearStreamingHistory  (2026-09-20)

## Corpus Check
- 16 files · ~6,846 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 122 nodes · 126 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `Clear Streaming History` - 8 edges
2. `Test Conventions` - 6 edges
3. `startClearing()` - 5 edges
4. `Clear Streaming History — Claude Instructions` - 5 edges
5. `JavaScript Conventions` - 5 edges
6. `Development` - 5 edges
7. `default_icon` - 4 edges
8. `icons` - 4 edges
9. `Browser Extension Testing Approach` - 4 edges
10. `Adding a New Streaming Service` - 4 edges

## Surprising Connections (you probably didn't know these)
- `startClearing()` --calls--> `log()`  [INFERRED]
  content.js → logger.js
- `startClearing()` --calls--> `getAdapter()`  [INFERRED]
  content.js → services/index.js

## Import Cycles
- None detected.

## Communities (13 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (9): Anti-Patterns, Browser Extension Testing Approach, Chrome API Mocking, Coverage Expectations, DOM Testing, Framework, Structure, Test Conventions (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (8): Architecture, Browser Extension Specifics, Clear Streaming History — Claude Instructions, Comments, Error Handling, JavaScript Conventions, Service Adapter Interface, Style

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): Adding a New Streaming Service, Architecture Notes, Clear Streaming History, Debugging, Development, Install dependencies, Installation, Pattern A — Direct button (like Amazon) (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (15): background, service_worker, content_scripts, description, host_permissions, icons, 128, 16 (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (7): AmazonAdapter, getAdapter(), SERVICE_REGISTRY, { AmazonAdapter }, { AmazonAdapter }, { DisneyPlusAdapter }, { getAdapter, SERVICE_REGISTRY }

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): description, devDependencies, jest, jest-environment-jsdom, jest, testEnvironment, testMatch, name (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (10): btnStart, btnStop, chkDebug, detectTab(), elService, elStatus, sendStart(), SERVICES (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (9): btnStart, btnStop, chkDebug, elService, elStatus, sendStart(), SERVICES, setRunning() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.38
Nodes (4): sendStatus(), sleep(), startClearing(), log()

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (5): action, default_icon, 128, 16, 48

## Knowledge Gaps
- **65 isolated node(s):** `manifest_version`, `name`, `version`, `description`, `permissions` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getAdapter()` connect `Community 6` to `Community 10`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `startClearing()` connect `Community 10` to `Community 6`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `startClearing()` (e.g. with `log()` and `getAdapter()`) actually correct?**
  _`startClearing()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `manifest_version`, `name`, `version` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._