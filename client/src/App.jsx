import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import ShowPage from './pages/ShowPage';
import Dashboard from './pages/Dashboard';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div {...pageTransition}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <Home />
              </AnimatedPage>
            }
          />
          <Route
            path="/show"
            element={
              <AnimatedPage>
                <ShowPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
