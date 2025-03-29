import React from 'react';
import { Edit, SimpleForm, TextInput } from 'react-admin';

export const UserEdit = (props) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="name" />
      <TextInput source="username" />
      <TextInput source="email" />
      <TextInput source="phone" />
    </SimpleForm>
  </Edit>
);
