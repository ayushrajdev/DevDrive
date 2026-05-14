import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Rq from "./practice/Rq.jsx";
import Tq from "./practice/Tq.jsx";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/rq",
    element: <Rq />,
  },
  {
    path: "/tq",
    element: <Tq />,
  },
]);
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    {/* <App /> */}

    <RouterProvider router={router} />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
