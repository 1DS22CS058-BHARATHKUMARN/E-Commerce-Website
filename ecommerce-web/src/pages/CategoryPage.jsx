import { Navigate, useParams } from "react-router-dom";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const cid = Number(categoryId);

  if (!Number.isFinite(cid) || cid <= 0) {
    return <div style={{ color: "crimson" }}>Invalid category id</div>;
  }

  return <Navigate to={`/products?categoryId=${cid}&sort=newest&page=1`} replace />;
}