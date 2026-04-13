// ── Path Utility ──
// Extracts dot-notation property paths from a type (e.g. 'status.value').
// Falls back to `string` when TEntity is `any` for backward compatibility.
type IsAny<T> = 0 extends 1 & T ? true : false;

export type PathsOf<T, Depth extends number[] = []> =
  IsAny<T> extends true
    ? string
    : Depth['length'] extends 3
      ? never
      : {
          [K in keyof T & string]: IsAny<T[K]> extends true
            ? K
            : NonNullable<T[K]> extends any[]
              ? K
              : NonNullable<T[K]> extends Record<string, any>
                ? K | `${K}.${PathsOf<NonNullable<T[K]>, [...Depth, 0]>}`
                : K;
        }[keyof T & string];
