import React from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Meta, Story } from '@storybook/react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Form from '../src/Form';
import S3 from '../src/S3';
import * as masks from '../src/masks/masks';

const meta: Meta = {
  title: 'Form',
  component: Form,
};

export default meta;

const schema = yup.object().shape({
  price: yup.number().transform(masks.brlCurrencyMask.transform),
  s3: yup
    .array()
    .of(yup.string())
    .transform(values => values.map(({ key }) => key)),
});

const Template: Story<{ onSubmit: any; multiple: boolean }> = ({
  onSubmit,
  multiple,
}) => {
  const methods = useForm<any>({
    defaultValues: { price: 123 },
    resolver: yupResolver(schema),
  });
  const { errors, handleSubmit } = methods;
  return (
    <Form methods={methods} onSubmit={handleSubmit(data => onSubmit(data))}>
      <Form.Field
        name="price"
        label="Price"
        onChange={masks.brlCurrencyMask.onChange}
      />
      <Form.Field name="s3" label={JSON.stringify({ multiple })}>
        <S3
          getS3Key={() => Date.now().toString()}
          getPutObjectSignedUrl={() => Promise.resolve('url')}
          multiple={multiple}
        />
      </Form.Field>
      <pre>{JSON.stringify(errors, null, 2)}</pre>
      <button type="submit">Submit</button>
    </Form>
  );
};

export const MultipleTrue = Template.bind({});
MultipleTrue.args = {
  multiple: true,
};

export const MultipleFalse = Template.bind({});
MultipleFalse.args = {
  multiple: false,
};
