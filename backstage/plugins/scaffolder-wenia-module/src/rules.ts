/**
 * AD-5: Validation rules — single source of truth.
 * The template's JSON schema copies must match these rules exactly.
 * A unit test (rules.test.ts) asserts that.
 */

/** Lowercase kebab-case, 3-40 chars, starts with a letter, ends letter/digit, no trailing hyphen */
export const SERVICE_NAME_PATTERN = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

/** Reserved Windows device names — blocked in service names */
export const RESERVED_NAMES = new Set([
  'con','prn','aux','nul',
  'com1','com2','com3','com4','com5','com6','com7','com8','com9',
  'lpt1','lpt2','lpt3','lpt4','lpt5','lpt6','lpt7','lpt8','lpt9',
]);

/** Description: 1-200 characters from a safe allow-list */
export const DESCRIPTION_MIN = 1;
export const DESCRIPTION_MAX = 200;
export const DESCRIPTION_PATTERN = /^[\w\s.,;:()\-']{1,200}$/;

/** API Definition limits */
export const API_DEF_MAX_BYTES = 200 * 1024; // 200 KB

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateServiceName(name: string): ValidationResult {
  if (!SERVICE_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      code: 'INVALID_NAME',
      message: `Service name "${name}" is invalid. Use lowercase kebab-case, 3–40 characters, starting with a letter, ending with a letter or digit.`,
    };
  }
  if (RESERVED_NAMES.has(name.toLowerCase())) {
    return {
      ok: false,
      code: 'INVALID_NAME',
      message: `Service name "${name}" is a reserved name and cannot be used.`,
    };
  }
  return { ok: true };
}

export function validateDescription(description: string): ValidationResult {
  if (!description || description.length < DESCRIPTION_MIN) {
    return { ok: false, code: 'INVALID_DESCRIPTION', message: 'Description is required.' };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      code: 'INVALID_DESCRIPTION',
      message: `Description must be at most ${DESCRIPTION_MAX} characters.`,
    };
  }
  return { ok: true };
}

export function validateApiDefinition(apiDef: string): ValidationResult {
  if (!apiDef || apiDef.trim() === '') {
    return { ok: false, code: 'INVALID_API_DEFINITION', message: 'API definition is required.' };
  }
  if (Buffer.byteLength(apiDef, 'utf8') > API_DEF_MAX_BYTES) {
    return {
      ok: false,
      code: 'INVALID_API_DEFINITION',
      message: `API definition exceeds the 200 KB limit.`,
    };
  }
  // Parse as YAML/JSON
  let parsed: any;
  try {
    const yaml = require('js-yaml');
    parsed = yaml.load(apiDef);
  } catch (e: any) {
    return {
      ok: false,
      code: 'INVALID_API_DEFINITION',
      message: `API definition failed to parse: ${e.message}`,
    };
  }
  // Check for external $ref (unsafe)
  const serialised = JSON.stringify(parsed);
  if (serialised.includes('"$ref":"http') || serialised.includes('"$ref":"https')) {
    return {
      ok: false,
      code: 'UNSAFE_API_DEFINITION',
      message: 'API definition contains external $ref URLs, which are not allowed.',
    };
  }
  return { ok: true };
}
