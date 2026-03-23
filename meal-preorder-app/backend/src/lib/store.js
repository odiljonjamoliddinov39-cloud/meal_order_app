export let nextDayId = 2;
export let nextItemId = 2;
export let nextOrderId = 2;

export const menuDays = [
  {
    id: 1,
    date: '2026-03-24',
    items: [
      {
        id: 1,
        name: 'Plov',
        price: 25000,
        quantity: 10,
      },
    ],
  },
];

export const orders = [
  {
    id: 1,
    status: 'PENDING',
    totalAmount: 25000,
    createdAt: new Date().toISOString(),
    customerName: 'Demo Customer',
    telegramId: '123456789',
    items: [
      {
        id: 1,
        quantity: 1,
        menuItem: {
          id: 1,
          name: 'Plov',
          price: 25000,
        },
      },
    ],
  },
];

export function getNextDayId() {
  return nextDayId++;
}

export function getNextItemId() {
  return nextItemId++;
}

export function getNextOrderId() {
  return nextOrderId++;
}