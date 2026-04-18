import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { coerceQueryParams, type FormStep } from '@zicenter/form-kit';
import { useNavigation } from '../providers/NavigationProvider';
import { useResourceDef } from '../providers/ResourceProvider';

export function useResourceFormDef(mode: 'create' | 'edit') {
  const def = useResourceDef();
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
