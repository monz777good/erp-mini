import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ✅ 관리자 1명 (네가 지금 쓰는 번호로 ADMIN 유지)
  const admin = await prisma.user.upsert({
    where: { phone: "01023833691" },
    update: { name: "이현택", role: "ADMIN" },
    create: { name: "이현택", phone: "01023833691", role: "ADMIN" },
  });

  // ✅ 영업사원 샘플 1명
  const sales = await prisma.user.upsert({
    where: { phone: "01010101010" },
    update: { name: "영업사원", role: "SALES" },
    create: { name: "영업사원", phone: "01010101010", role: "SALES" },
  });

  // ✅ 품목 샘플들 (필요하면 추가해도 됨)
  const item1 = await prisma.item.upsert({
    where: { name: "자하거 2mL" },
    update: {},
    create: { name: "자하거 2mL" },
  });

  const item2 = await prisma.item.upsert({
    where: { name: "죽염 1.8 2mL" },
    update: {},
    create: { name: "죽염 1.8 2mL" },
  });

  // ✅ 주문 샘플 1건 (PENDING 화면에서 보이게 REQUESTED로 넣음)
  // ⚠️ 여기서 중요한 것:
  // - Order 모델에 있는 필드만 넣어야 함 (boxCount 같은 거 넣으면 바로 터짐)
  await prisma.order.create({
    data: {
      quantity: 1,
      status: "REQUESTED",
      note: "시드 주문(테스트)",

      user: { connect: { id: sales.id } },
      item: { connect: { id: item1.id } },

      receiverName: "이현택",
      receiverAddr: "경기도 시흥시 (테스트 주소)",
      phone: "01023833691",
      mobile: "01023833691",
      message: "취급주의",
    },
  });

  console.log("✅ SEED COMPLETE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

