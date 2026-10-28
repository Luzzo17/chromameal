import { apiRequest, initializeCsrf } from './api'

export type ShoppingItem = {
  id: number
  name: string
  quantity: string | null
  is_purchased: boolean
}

export function getShoppingItems() {
  return apiRequest<{ data: ShoppingItem[] }>('shopping-items')
}

export async function addShoppingItem(name: string, quantity: string) {
  await initializeCsrf()
  return apiRequest<{ data: ShoppingItem }>('shopping-items', {
    method: 'POST', body: JSON.stringify({ name, quantity: quantity.trim() || null }),
  })
}

export async function updateShoppingItem(id: number, changes: Partial<Omit<ShoppingItem, 'id'>>) {
  await initializeCsrf()
  return apiRequest<{ data: ShoppingItem }>(`shopping-items/${id}`, {
    method: 'PATCH', body: JSON.stringify(changes),
  })
}

export async function deleteShoppingItem(id: number) {
  await initializeCsrf()
  return apiRequest<void>(`shopping-items/${id}`, { method: 'DELETE' })
}
