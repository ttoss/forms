import * as React from 'react';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Input, InputProps } from 'theme-ui';
import * as yup from 'yup';

export type GetPutObjectSignedUrl = (data: {
  key: string;
  type: string;
}) => Promise<string | undefined>;

type S3Props = {
  getKey: (data: { name: string; filename: string }) => string;
  getPutObjectSignedUrl: GetPutObjectSignedUrl;
  t?: (key: string, params?: any) => string;
} & InputProps;

export interface CompoundedS3
  extends React.ForwardRefExoticComponent<
    S3Props & React.RefAttributes<HTMLInputElement>
  > {
  yup: (
    multiple?: boolean
  ) => yup.StringSchema | yup.ArraySchema<yup.StringSchema>;
}

const S3 = React.forwardRef<any, S3Props>(
  (
    {
      getKey,
      getPutObjectSignedUrl,
      t = key => key, // If t is not defined, return key only.
      ref: inputPropsRef,
      ...inputProps
    },
    register
  ) => {
    const { multiple, name = '' } = inputProps;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { control, setError } = useFormContext();
    const { append, fields, remove } = useFieldArray({ control, name });

    const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }

      try {
        await Promise.all(
          Array.from(event.target.files).map(async file => {
            const filename = file.name;
            const type = file.type;
            const key = getKey({ name, filename });

            try {
              const signedUrl = await getPutObjectSignedUrl({
                key,
                type,
              });

              if (!signedUrl) {
                throw new Error();
              }

              const { status } = await fetch(signedUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': type,
                },
                body: await file.arrayBuffer(),
              });

              if (status !== 200) {
                throw new Error();
              }

              if (!multiple) {
                remove();
              }

              append({ key });
            } catch (err) {
              setError(name, {
                message: t('Cannot upload {{filename}}', { filename }),
              });
            }
          })
        );
      } catch (err) {
        setError(name, { message: t(err.message) });
      }
    };

    return (
      <>
        <input
          type="file"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onChange}
          multiple={multiple}
        />
        {fields.map(({ id, key }, index) => (
          <input
            type="hidden"
            key={id}
            ref={register}
            name={`${name}[${index}].key`}
            defaultValue={key}
          />
        ))}
        <Input
          {...inputProps}
          ref={register}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        />
      </>
    );
  }
) as CompoundedS3;

S3.yup = (multiple: boolean = false) =>
  multiple
    ? yup
        .array()
        .of(yup.string())
        .transform(values => {
          return values.map(({ key }: { key: string }) => key);
        })
    : yup.string().transform(values => {
        return values[0].key;
      });

export default S3;
