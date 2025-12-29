import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import BookList from './pages/BookList';
import BookDetails from './pages/BookDetails';
import PdfViewer from './pages/PdfViewer';
import SearchResults from './pages/SearchResults';
import Admin from './pages/Admin';
import { BookProvider } from './context/BookContext';
import { ThemeProvider } from './context/ThemeContext';

// Helper to conditionally render header
const Layout: React.FC = () => {
  const location = useLocation();
  // Don't show header on read page to maximize space
  const isReader = location.pathname.startsWith('/read/');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isReader && !isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/class/:classId" element={<BookList />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/book/:bookId" element={<BookDetails />} />
        <Route path="/read/:bookId" element={<PdfViewer />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BookProvider>
        <Router>
          <Layout />
        </Router>
      </BookProvider>
    </ThemeProvider>
  );
};

export default App;