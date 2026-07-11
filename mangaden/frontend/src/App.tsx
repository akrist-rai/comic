import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import Library from './pages/Library';

function RootLayout() {
  return (
    <>
      <Navbar />
      <Library />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '*',
    element: <RootLayout />,
  },
]);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TaskProvider>
          <RouterProvider router={router} />
        </TaskProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
