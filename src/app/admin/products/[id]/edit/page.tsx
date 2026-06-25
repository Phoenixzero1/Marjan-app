"use client";
import { useRouter } from "next/navigation";
import { use } from "react";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  return (
    <ProductForm
      productId={id}
      onSuccess={() => router.push("/admin/products")}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
