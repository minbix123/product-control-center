import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, createProduct, updateProduct, softDeleteProduct } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { Product, ProductStatus } from '../types';

export function useProducts(filters?: { status?: ProductStatus; search?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.search]);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('products', () => { refetch(); }, [refetch]);

  const create = async (data: { name: string; description: string; status: ProductStatus }) => {
    const product = await createProduct(data);
    addToast({ type: 'success', title: 'Product created', message: `${product.name} has been created.` });
    await refetch();
    return product;
  };

  const update = async (id: string, data: { name?: string; description?: string; status?: ProductStatus }) => {
    const product = await updateProduct(id, data);
    addToast({ type: 'success', title: 'Product updated', message: `${product.name} has been updated.` });
    await refetch();
    return product;
  };

  const softDelete = async (id: string) => {
    await softDeleteProduct(id);
    addToast({ type: 'success', title: 'Product deleted' });
    await refetch();
  };

  return { products, loading, error, refetch, create, update, softDelete };
}
