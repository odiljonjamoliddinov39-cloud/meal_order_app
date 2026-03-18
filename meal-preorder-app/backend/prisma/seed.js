import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  // Create menu days for the next 7 days
  const menuDays = [];
  for (let i = 0; i < 7; i++) {
    const date = dayjs().add(i, 'day').startOf('day').toDate();
    const orderDeadline = dayjs(date).subtract(2, 'hour').toDate(); // 2 hours before the day

    const menuDay = await prisma.menuDay.create({
      data: {
        date,
        orderDeadline,
        isOpen: true
      }
    });
    menuDays.push(menuDay);
  }

  // Sample menu items for each day
  const sampleItems = [
    { name: 'Grilled Chicken Salad', description: 'Fresh greens with grilled chicken, tomatoes, and vinaigrette', price: 12.99, plannedQuantity: 50 },
    { name: 'Beef Burger', description: 'Juicy beef patty with lettuce, tomato, and cheese', price: 15.99, plannedQuantity: 30 },
    { name: 'Vegetarian Pasta', description: 'Penne pasta with seasonal vegetables and pesto sauce', price: 11.99, plannedQuantity: 40 },
    { name: 'Fish and Chips', description: 'Crispy battered fish with fries and tartar sauce', price: 14.99, plannedQuantity: 25 },
    { name: 'Caesar Salad', description: 'Romaine lettuce with croutons, parmesan, and caesar dressing', price: 10.99, plannedQuantity: 35 }
  ];

  for (const menuDay of menuDays) {
    for (const item of sampleItems) {
      await prisma.menuItem.create({
        data: {
          menuDayId: menuDay.id,
          name: item.name,
          description: item.description,
          price: item.price,
          plannedQuantity: item.plannedQuantity,
          isActive: true
        }
      });
    }
  }

  console.log('Sample data seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });