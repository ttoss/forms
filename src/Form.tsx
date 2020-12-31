import * as React from 'react';

import { ErrorMessage as HookFormErrorMessage } from '@hookform/error-message';
import get from 'lodash/get';
import { FormProvider, useFormContext, UseFormMethods } from 'react-hook-form';
import { Box, BoxProps, Input, InputProps, Label, Text } from 'theme-ui';

const Form = <T,>({
  children,
  methods,
  ...boxProps
}: {
  children?: React.ReactNode;
  methods: UseFormMethods<T>;
  onSubmit?: ((data: React.FormEvent<HTMLDivElement>) => void) | undefined;
} & BoxProps) => {
  return (
    <FormProvider {...methods}>
      <Box as="form" variant="forms.form" {...boxProps}>
        {children}
      </Box>
    </FormProvider>
  );
};

export const ErrorMessage = ({ name }: { name: string }) => {
  const { errors } = useFormContext();
  return (
    <HookFormErrorMessage
      errors={errors}
      name={name}
      render={({ message, messages }) => {
        if (messages) {
          return (
            <>
              {Object.entries(messages).map(([type, message]) => (
                <Text variant="text.error" role="alert" key={type}>
                  {message}
                </Text>
              ))}
            </>
          );
        }
        return (
          <Text variant="text.error" role="alert">
            {message}
          </Text>
        );
      }}
    />
  );
};

const Field = ({
  name,
  children,
  label,
  ref: inputRef,
  ...inputProps
}: {
  name: string;
  children?: React.ReactNode;
  label?: string;
} & InputProps) => {
  const { errors, register } = useFormContext();
  const error = get(errors, name);
  const commonProps = {
    name,
    key: name,
    id: name,
    'aria-invalid': (error ? 'true' : 'false') as any,
  };
  return (
    <Box variant="forms.field">
      {label && <Label htmlFor={name}>{label}</Label>}
      {children ? (
        React.Children.map(children, child => {
          return React.createElement((child as any).type, {
            ref: register(),
            ...commonProps,
            ...(child as any).props,
          });
        })
      ) : (
        <Input ref={register()} {...commonProps} {...inputProps} />
      )}
      <ErrorMessage name={name} />
    </Box>
  );
};

Form.ErrorMessage = ErrorMessage;
Form.Field = Field;

export default Form;
