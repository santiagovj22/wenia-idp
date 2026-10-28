# Troubleshooting — ${{ values.serviceName }}

## Service errors

| Code | Meaning | Next step |
| --- | --- | --- |
| `VALIDATION_ERROR` | Request body failed schema validation | Check field types and required fields against the OpenAPI definition |
| `NOT_FOUND` | Requested resource does not exist | Confirm the id |
| `INTERNAL_ERROR` | Unexpected server error | Check the service logs for the stack trace |

## Generation errors (IDP)

If this service was just generated and something went wrong, see the
[IDP troubleshooting guide](https://github.com/santiagovj22/wenia-idp/blob/main/docs/troubleshooting-idp.md).

| Code | Meaning | Next step |
| --- | --- | --- |
| `INVALID_NAME` | Service name breaks the naming rule | Use lowercase kebab-case, 3–40 chars, no trailing hyphen, not a reserved name |
| `DUPLICATE_NAME` | Name exists in catalog or GitHub | Choose a different name, or delete the existing service first |
| `INVALID_API_DEFINITION` | OpenAPI document failed to parse | Fix the YAML/JSON syntax errors |
| `UNSAFE_API_DEFINITION` | API definition contains external references or is too large | Remove `$ref` to external URLs; keep the definition under 200 KB |
| `GITHUB_ERROR` | Could not create or push the repository | Check that `GITHUB_TOKEN` has `repo` and `workflow` scopes |
| `CATALOG_ERROR` | Could not register the entity | Check Backstage logs; ensure `catalog.rules` allows Component and API |
| `COMPENSATION_FAILED` | Cleanup after failure left orphan resources | See the leftover list in the run log; delete the repository manually |
| `INJECTED_FAILURE` | Failure was injected for demonstration | This is expected; re-submit with `failureInjection: none` |
