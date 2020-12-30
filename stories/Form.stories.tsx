import React from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Meta, Story } from '@storybook/react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Form from '../src/Form';
import S3 from '../src/S3';

const meta: Meta = {
  title: 'Form',
  component: Form,
};

export default meta;

const Template: Story<{ onSubmit: any; multiple: boolean; schema: any }> = ({
  schema,
  onSubmit,
  multiple,
}) => {
  const methods = useForm({
    resolver: yupResolver(schema),
  });
  const { handleSubmit } = methods;
  return (
    <Form methods={methods} onSubmit={handleSubmit(data => onSubmit(data))}>
      <Form.Field name="s3" label={JSON.stringify({ multiple })}>
        <S3
          getKey={() => Date.now().toString()}
          getPutObjectSignedUrl={() => Promise.resolve('url')}
          multiple={multiple}
        />
      </Form.Field>
      <button type="submit">Submit</button>
    </Form>
  );
};

export const MultipleTrue = Template.bind({});
MultipleTrue.args = {
  multiple: true,
  schema: yup.object().shape({
    s3: S3.yup(true).required(),
  }),
};

export const MultipleFalse = Template.bind({});
MultipleFalse.args = {
  multiple: false,
  schema: yup.object().shape({
    s3: S3.yup(false).required(),
  }),
};
