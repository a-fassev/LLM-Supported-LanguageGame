# Task Evaluation Error Contract (WP4)

This document is the canonical WP4 mapping for `POST /api/tasks/evaluate`.

When `TASK_EVAL_API_KEY` is set in the Next.js environment, Unity must send the same value in the `x-task-eval-api-key` request header (via `GameRuntimeConfig.taskEvaluationApiKey`). An empty server key disables this check (typical for local dev).

## Message Ownership Policy

- Player-facing copy is owned by Unity via `ErrorMessageCatalog`.
- API `message` values are diagnostic text for logs and troubleshooting.
- Unity must map `code` and HTTP status to `AppErrorCode` and ignore API wording for UX text.

## Server to Unity Error Matrix

| HTTP Status | API `code` | Retryable | Unity `AppErrorCode` | Player message source |
| --- | --- | --- | --- | --- |
| 400 | `INVALID_JSON` | false | `TaskConfigInvalid` | `ErrorMessageCatalog.TaskConfigInvalid` |
| 401 | `UNAUTHORIZED` | false | `TaskConfigInvalid` | `ErrorMessageCatalog.TaskConfigInvalid` |
| 422 | `PAYLOAD_INVALID` | false | `TaskConfigInvalid` | `ErrorMessageCatalog.TaskConfigInvalid` |
| 429 | `RATE_LIMITED` | true | `ApiUnavailable` | `ErrorMessageCatalog.ApiUnavailable` |
| 502 | `INVALID_MODEL_OUTPUT` | true | `ApiInvalidResponse` | `ErrorMessageCatalog.ApiInvalidResponse` |
| 503 | `PROVIDER_UNAVAILABLE` | true | `ApiUnavailable` | `ErrorMessageCatalog.ApiUnavailable` |
| 504 | `MODEL_TIMEOUT` | true | `NetworkTimeout` | `ErrorMessageCatalog.NetworkTimeout` |
| 500 | `INTERNAL_ERROR` | true | `ApiUnavailable` | `ErrorMessageCatalog.ApiUnavailable` |

## Fallback Rules

- If `code` is missing but status is `400`, Unity maps to `TaskConfigInvalid`.
- If `code` is missing but status is `401`, Unity maps to `TaskConfigInvalid`.
- If `code` is missing but status is `504`, Unity maps to `NetworkTimeout`.
- If `code` is missing but status is `429` or any `>=500`, Unity maps to `ApiUnavailable`.
- Any other malformed response maps to `ApiInvalidResponse`.
