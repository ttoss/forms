import * as React from 'react';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Input, InputProps } from 'theme-ui';

import { ErrorMessage } from './Form';

export type GetPutObjectSignedUrl = (data: {
  key: string;
  type: string;
}) => Promise<string | undefined>;

export type GetS3Key = (data: { name: string; filename: string }) => string;

type S3File = {
  key: string;
  filename: string;
  type: string;
};

type S3Props = {
  getS3Key: GetS3Key;
  getPutObjectSignedUrl: GetPutObjectSignedUrl;
  renderUploadStatus?: (data: {
    success?: S3File[];
    failed?: S3File[];
  }) => React.ReactNode;
} & InputProps;

const S3 = ({
  getS3Key,
  getPutObjectSignedUrl,
  renderUploadStatus,
  ref: inputPropsRef,
  ...inputProps
}: S3Props) => {
  const { multiple, name = '' } = inputProps;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { clearErrors, control, register, setError, watch } = useFormContext();
  const { append, fields, remove } = useFieldArray({ control, name });
  const [failed, setFailed] = React.useState<S3File[]>();
  const success = watch(name);

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    clearErrors(name);

    try {
      await Promise.all(
        Array.from(event.target.files).map(async file => {
          const filename = file.name;
          const type = file.type;
          const key = getS3Key({ name, filename });

          const s3File = { key, filename, type };

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

            append(s3File);
          } catch (err) {
            setFailed(f => [s3File, ...(f || [])]);
          }
        })
      );
    } catch (err) {
      setError(name, { message: err.message });
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
      <Input
        {...inputProps}
        ref={register()}
        onClick={() => {
          fileInputRef.current?.click();
        }}
      />
      {fields.map(({ id, key, filename, type }, index) => {
        return (
          <React.Fragment key={id}>
            <input
              type="hidden"
              ref={register()}
              name={`${name}[${index}].key`}
              defaultValue={key}
            />
            <ErrorMessage name={`${name}[${index}].key`} />
            <input
              type="hidden"
              ref={register}
              name={`${name}[${index}].filename`}
              defaultValue={filename}
            />
            <ErrorMessage name={`${name}[${index}].filename`} />
            <input
              type="hidden"
              ref={register()}
              name={`${name}[${index}].type`}
              defaultValue={type}
            />
            <ErrorMessage name={`${name}[${index}].type`} />
          </React.Fragment>
        );
      })}
      {renderUploadStatus?.({ success, failed })}
    </>
  );
};

export default S3;
