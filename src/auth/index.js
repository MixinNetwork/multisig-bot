import React, { useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import Loading from '../components/loading.js';
import { ApiPostAuthenticate, } from '../api'

function Index() {
  const [state, setState] = useState({loading: true});
  const searchParams = new URLSearchParams(useLocation().search);

  ApiPostAuthenticate(searchParams.get('code')).then(() => {
    setState({loading: false});
  })

  if (state.loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  return (
    <Redirect to='/' />
  )
}

export default Index;
