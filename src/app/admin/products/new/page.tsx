"use client";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminProductNewPage() {
  const router = useRouter();
  return (
    <ProductForm
      onSuccess={() => router.push("/admin/products")}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
