import { Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-500">Auth page — coming in EP-02</p></div>} />
      <Route path="/dashboard" element={<div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-500">Dashboard — coming in EP-05</p></div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
