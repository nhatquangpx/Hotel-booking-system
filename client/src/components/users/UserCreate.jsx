import React from 'react';
import { Create, SimpleForm, TextInput, NumberInput } from 'react-admin';

export const UserCreate = (props) => (
  <Create {...props} title="Create a User">
    <SimpleForm>
      <NumberInput source="id" />
      <TextInput source="name" />
      <TextInput source="username" />
      <TextInput source="email" />
      <TextInput source="phone" />
    </SimpleForm>
  </Create>
);
