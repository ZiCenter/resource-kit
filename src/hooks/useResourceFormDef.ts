import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { coerceQueryParams, type FormStep } from '@zicenter/form-kit';
import { useNavigation } from '../providers/NavigationProvider';
import type { LoadedResource } from '../resource';

/**
 * Normalizes a resource's form definition into a consistent steps structure.
 * Handles create vs edit mode, single-field → step conversion, and query param defaults.
 */
export function useResourceFormDef(def: LoadedResource, mode: 'create' | 'edit') {
  const queryClient = useQueryClient();
  const { useQueryParams } = useNavigation();
  const [searchParams] = useQueryParams();

  const formFn = mode === 'edit' ? (def.editForm ?? def.createForm) : def.createForm;

  const form = useMemo(() => formFn?.(queryClient), [formFn, queryClient]);

  const steps: FormStep[] = useMemo(() => {
    if (!form) return [];
    return form.steps ?? [{ id: 'default', label: def.label, fields: form.fields ?? [] }];
  }, [form, def.label]);

  const allFields = useMemo(() => steps.flatMap((s) => s.fields ?? []), [steps]);

  const defaultValues = useMemo(
    () => coerceQueryParams(searchParams, allFields),
    [searchParams, allFields],
  );

  return {
    form,
    steps,
    defaultValues,
    onFormValuesChange: form?.onFormValuesChange,
  };
}
