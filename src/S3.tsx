import * as React from 'react';

import { useFormContext } from 'react-hook-form';
import { Input, InputProps } from 'theme-ui';

export type GetPutObjectSignedUrl = (data: {
  key: string;
}) => Promise<string | undefined>;

const S3 = React.forwardRef<
  any,
  {
    name?: string;
    keyPrefix?: string;
    getPutObjectSignedUrl?: GetPutObjectSignedUrl;
    t?: (key: string, params?: any) => string;
  } & InputProps
>(
  (
    {
      name = '',
      getPutObjectSignedUrl,
      keyPrefix,
      t = key => key, // If t is not defined, return key only.
      ref: inputPropsRef,
      ...inputProps
    },
    ref
  ) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { getValues, setError, setValue } = useFormContext();
    const { multiple } = inputProps;

    const onChange = React.useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
          return;
        }

        if (!getPutObjectSignedUrl) {
          setError(name, {
            message: t('getPutObjectSignedUrl is not defined'),
          });
          return;
        }

        try {
          await Promise.all(
            Array.from(event.target.files).map(async file => {
              const filename = file.name;
              // const type = file.type;
              const key = keyPrefix
                ? [keyPrefix, filename].join('/')
                : filename;

              try {
                const signedUrl = await getPutObjectSignedUrl({
                  key,
                });

                if (!signedUrl) {
                  throw new Error();
                }

                await fetch(signedUrl, {
                  method: 'PUT',
                  body: await file.arrayBuffer(),
                });

                setValue(name, multiple ? [key, ...getValues(name)] : key);
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
      },
      [getPutObjectSignedUrl, keyPrefix, t, setValue, getValues]
    );

    return (
      <>
        <input
          type="file"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onChange}
          multiple
        />
        <Input
          {...inputProps}
          ref={ref}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        />
      </>
    );
  }
);

export default S3;
