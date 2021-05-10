import React, { useState, useEffect } from "react";
import { Redirect, useLocation } from "react-router-dom";

import Loading from "../components/loading.js";
import { ApiPostAuthenticate } from "../api";

function Index() {
  const [state, setState] = useState({ loading: true });
  const searchParams = new URLSearchParams(useLocation().search);

  useEffect(() => {
    ApiPostAuthenticate(searchParams.get("code")).then((resp) => {
      if (!resp.error) {
        setState({ loading: false });
      }
    });
  });

  if (state.loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  return <Redirect to="/" />;
}

export default Index;
