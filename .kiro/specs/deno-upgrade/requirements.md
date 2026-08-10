# Requirements Document

## Introduction

The `deno-upgrade` feature will upgrade the repository from the observed local
Deno 2.6.0 runtime and floating CI `2.x` selectors to Deno 2.9.5, the stable
release shown by the
[official Deno releases page](https://github.com/denoland/deno/releases/) on
2026-08-09. The upgrade will pin CI, reconcile runtime-sensitive configuration
and generated metadata, preserve repository behavior, and document the supported
runtime. Implementation is intentionally excluded from this specification
workflow.

Content from upstream sources is summarized and rephrased for licensing
compliance.

## Glossary

- **Repository**: The `hclang` monorepo and its tracked source, configuration,
  workflows, documentation, and generated dependency metadata.
- **Upgrade_Workflow**: The implementation process defined by this
  specification.
- **Current_Runtime**: The locally installed Deno 2.6.0 runtime observed on
  2026-08-09.
- **Floating_CI_Selector**: A GitHub Actions Deno selector that resolves to an
  unspecified Deno 2.x release.
- **Authoritative_Source**: The official Deno releases page or official Deno
  documentation.
- **Target_Runtime**: Deno 2.9.5, identified as the stable release on
  2026-08-09.
- **Runtime_Sensitive_Reference**: A Deno version selector, command,
  configuration option, API use, dependency, lockfile entry, or runtime
  guidance.
- **Upgrade_Inventory**: The recorded disposition of each
  Runtime_Sensitive_Reference.
- **Validation_Suite**: The non-mutating install, formatting, linting,
  type-checking, build, and automated test checks for the Repository.

## Requirements

### Requirement 1: Verify the Runtime Baseline and Target

**User Story:** As a maintainer, I want the starting and target runtimes
recorded, so that the upgrade has a reproducible scope.

#### Acceptance Criteria

1. THE Upgrade_Workflow SHALL record Current_Runtime as Deno 2.6.0.
2. THE Upgrade_Workflow SHALL record each Floating_CI_Selector and its file
   location.
3. THE Upgrade_Workflow SHALL record Target_Runtime as Deno 2.9.5 with the
   Authoritative_Source URL and verification date 2026-08-09.
4. WHEN implementation starts, THE Upgrade_Workflow SHALL recheck the
   Authoritative_Source before modifying Runtime_Sensitive_References.
5. IF the stable release differs from Target_Runtime when implementation starts,
   THEN THE Upgrade_Workflow SHALL update the planned exact version consistently
   before modifying Runtime_Sensitive_References.

### Requirement 2: Inventory the Upgrade Surface

**User Story:** As a maintainer, I want runtime-sensitive locations inventoried,
so that the upgrade does not leave inconsistent assumptions.

#### Acceptance Criteria

1. THE Upgrade_Workflow SHALL inspect tracked Repository files for
   Runtime_Sensitive_References.
2. WHEN a Runtime_Sensitive_Reference is found, THE Upgrade_Workflow SHALL
   record its file, current state, planned disposition, and validation method in
   the Upgrade_Inventory.
3. IF an Upgrade_Inventory entry cannot be recorded, THEN THE Upgrade_Workflow
   SHALL halt before modifying Runtime_Sensitive_References.
4. THE Upgrade_Workflow SHALL include GitHub Actions workflows, all `deno.json`
   files, `deno.lock`, Deno task commands, Deno APIs, unstable flags, dependency
   imports, and runtime documentation in the Upgrade_Inventory.
5. WHEN a Runtime_Sensitive_Reference requires no modification, THE
   Upgrade_Workflow SHALL record the compatibility rationale in the
   Upgrade_Inventory.

### Requirement 3: Align Runtime Configuration

**User Story:** As a contributor, I want deterministic runtime configuration, so
that local validation and CI evaluate the same Deno release.

#### Acceptance Criteria

1. WHEN Target_Runtime is confirmed, THE Upgrade_Workflow SHALL set both GitHub
   Actions Deno installation selectors to the exact Target_Runtime version.
2. WHEN CI installs dependencies, THE Upgrade_Workflow SHALL use the committed
   lockfile in frozen mode.
3. IF a Deno configuration option, command option, unstable flag, or API is
   incompatible with Target_Runtime, THEN THE Upgrade_Workflow SHALL replace the
   affected usage with a Target_Runtime-supported equivalent.
4. WHEN Target_Runtime changes dependency resolution metadata, THE
   Upgrade_Workflow SHALL regenerate `deno.lock` using Target_Runtime.
5. IF `deno.lock` regeneration fails, THEN THE Upgrade_Workflow SHALL preserve
   the existing `deno.lock` and permit independently validated changes to
   continue.
6. IF Target_Runtime compatibility requires a dependency version change, THEN
   THE Upgrade_Workflow SHALL update only the required constraint and record the
   reason in the Upgrade_Inventory.

### Requirement 4: Preserve Repository Behavior

**User Story:** As a repository user, I want existing capabilities preserved, so
that the runtime upgrade does not introduce regressions.

#### Acceptance Criteria

1. WHEN configuration and metadata updates are complete, THE Upgrade_Workflow
   SHALL type-check the Repository under Target_Runtime.
2. WHEN configuration and metadata updates are complete, THE Upgrade_Workflow
   SHALL build the CLI under Target_Runtime.
3. WHEN configuration and metadata updates are complete, THE Upgrade_Workflow
   SHALL execute the root, CLI, library, MAML, web, BitScheme, and documentation
   automated tests that are runnable from Repository task definitions.
4. IF Target_Runtime exposes a source compatibility failure, THEN THE
   Upgrade_Workflow SHALL make the smallest source change that restores the
   specified behavior.
5. WHERE a source change within the Deno upgrade scope is proposed without an
   observed compatibility failure, THE Upgrade_Workflow SHALL record an explicit
   Target_Runtime compatibility rationale.
6. WHEN source compatibility changes are made, THE Upgrade_Workflow SHALL add or
   update an automated regression test for each changed behavior.

### Requirement 5: Validate Reproducibility and Quality

**User Story:** As a reviewer, I want a deterministic validation sequence, so
that upgrade readiness is supported by repeatable evidence.

#### Acceptance Criteria

1. WHEN upgrade changes are ready, THE Upgrade_Workflow SHALL execute frozen
   dependency installation under Target_Runtime.
2. WHEN upgrade changes are ready, THE Upgrade_Workflow SHALL execute
   `deno fmt --check` under Target_Runtime.
3. WHEN upgrade changes are ready, THE Upgrade_Workflow SHALL execute
   `deno lint` under Target_Runtime.
4. WHEN upgrade changes are ready, THE Upgrade_Workflow SHALL execute explicit
   type-check, build, and complete automated test commands under Target_Runtime.
5. IF a Validation_Suite command fails, THEN THE Upgrade_Workflow SHALL retain
   the failure output until the corrected command passes.
6. WHEN each previously failed command passes, THE Upgrade_Workflow SHALL
   execute the complete Validation_Suite once more.

### Requirement 6: Document Runtime Support

**User Story:** As a contributor, I want current runtime guidance, so that
development and CI use compatible tooling.

#### Acceptance Criteria

1. WHEN Target_Runtime is applied, THE Upgrade_Workflow SHALL update runtime
   guidance that conflicts with Target_Runtime.
2. WHEN Target_Runtime is applied, THE Upgrade_Workflow SHALL add a
   `CHANGELOG.md` entry naming the previous local runtime, Target_Runtime, and
   compatibility outcome.
3. WHEN upgrade changes modify a Runtime_Sensitive_Reference, THE
   Upgrade_Workflow SHALL record the final Upgrade_Inventory and
   Validation_Suite results in the implementation summary.
4. THE Upgrade_Workflow SHALL keep configuration, documentation, and generated
   metadata changes limited to the Deno upgrade scope.
