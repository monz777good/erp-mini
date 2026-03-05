import { prisma } from "../src/lib/prisma";
import { Role, OrderStatus } from "@prisma/client";

async function main() {
  // ✅ 유저는 phone이 unique라 upsert OK
  const admin = await prisma.user.upsert({
    where: { phone: "01023833691" },
    update: { name: "이현택", role: Role.ADMIN },
    create: { name: "이현택", phone: "01023833691", role: Role.ADMIN },
  });

  const sales = await prisma.user.upsert({
    where: { phone: "01012341234" },
    update: { name: "영업사원", role: Role.SALES },
    create: { name: "영업사원", phone: "01012341234", role: Role.SALES },
  });

  // ✅ Client.name이 unique가 아닐 수 있어서: 있으면 첫 번째 가져오고, 없으면 생성
  let client = await prisma.client.findFirst({
    where: { name: "샘플거래처" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: { name: "샘플거래처" },
    });
  }

  // ✅ Item.name은 네 스키마에서 unique라 upsert OK (너가 올린 schema에 name @unique 였음)
  const item = await prisma.item.upsert({
    where: { name: "샘플품목" },
    update: {},
    create: { name: "샘플품목" },
  });

  // ✅ 주문 샘플 1개
  await prisma.order.create({
    data: {
      userId: sales.id,
      clientId: client.id,
      itemId: item.id,
      status: OrderStatus.REQUESTED,
      quantity: 1,

      receiverName: "수령인",
      receiverAddr: "주소",
      phone: "01000000000",
      mobile: "01000000000",
      note: "seed 주문",
    },
  });

  console.log("✅ Seed complete:", {
    admin: admin.phone,
    sales: sales.phone,
    client: client.name,
    item: item.name,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });