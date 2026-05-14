import {
  createBrowserRouter,
  Link,
  NavLink,
  RouterProvider,
} from "react-router-dom";
import DirectoryView from "./DirectoryView";
import LoginForm from "./Login";
import RegisterForm from "./Register";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/directory/:directoryIdFromUrl",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/file/:fileId",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/register",
//     element: <RegisterForm />,
//   },
//   {
//     path: "/login",
//     element: <LoginForm />,
//   },
// ]);

// const App = () => {
//   return <RouterProvider router={router} />;
// };

const App = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["posts"],
    queryFn: () =>
      fetch("https://jsonplaceholder.typicode.com/posts").then((res) =>
        res.json(),
      ),
    staleTime: 300000,
  });
  console.log(data);
  return (
    <div>
      <div>
        <Link to={"/"}>home</Link>
        <br />
        <Link to={"/rq"}>rq</Link>
        <br />
        <Link to={"/tq"}>tq</Link>
      </div>
      <h1>hello</h1>
      <div>{JSON.stringify(data)}</div>
    </div>
  );
};

export default App;
