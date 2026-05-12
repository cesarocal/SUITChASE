import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <RouterProvider router={router} />
    </div>
  );
}
