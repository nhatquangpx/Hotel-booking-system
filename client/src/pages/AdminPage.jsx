import React from 'react';
import { Admin, Resource } from 'react-admin';
import restProvider from 'ra-data-simple-rest';
import { authProvider } from '../auth/authProvider'; // file authProvider tự tạo (theo hướng dẫn của bạn)
import AppLayout from '../layouts/AppLayout'; // Layout có thể tùy chỉnh (xem phần bên dưới)

import { UserList } from '../components/users/UserList';
import { UserEdit } from '../components/users/UserEdit';
import { UserCreate } from '../components/users/UserCreate';

// import { PostList } from '../components/posts/PostList';
// import { PostEdit } from '../components/posts/PostEdit';
// import { PostCreate } from '../components/posts/PostCreate';

const dataProvider = restProvider('http://localhost:3000'); // Địa chỉ API của bạn

const AdminPage = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider} layout={AppLayout}>
    <Resource 
      name="users" 
      list={UserList} 
      edit={UserEdit} 
      create={UserCreate} 
      recordRepresentation={(record) => record.username} 
    />
    {/* <Resource 
      name="posts" 
      list={PostList} 
      edit={PostEdit} 
      create={PostCreate} 
    /> */}
  </Admin>
);

export default AdminPage;
