// This page is now replaced by RealityShiftTracker at /tracker
// Kept as a redirect to avoid broken links
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Progress() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/tracker", { replace: true }); }, []);
  return null;
}