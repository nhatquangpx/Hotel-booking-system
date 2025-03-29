import React from 'react';
import { List, Datagrid, TextField, EmailField, DeleteButton } from 'react-admin';

export const UserList = (props) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="phone" />
      <DeleteButton />
    </Datagrid>
  </List>
);
