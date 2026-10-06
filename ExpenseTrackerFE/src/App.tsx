import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import AddExpensePage from "./pages/AddExpensePage/AddExpensePage";
import CategoriesPage from "./pages/CategoriesPage/CategoriesPage";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage/AnalyticsPage";
import "./App.css";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<AddExpensePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </>
  );
}
